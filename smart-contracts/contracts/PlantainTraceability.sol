// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PlantainTraceability
 * @dev On-chain traceability for plantain flour supply chain
 * @notice Tracks plantain from farm → processor → distributor → consumer
 */
contract PlantainTraceability {
    // ============ Enums ============
    
    enum BatchStatus { Created, Processed, Distributed, InTransit, Delivered, Sold }
    enum OrderStatus { Placed, Confirmed, Processing, Shipped, Delivered, Completed, Cancelled, Refunded }
    enum DeliveryMode { Pickup, StandardDelivery, ExpressDelivery, SameDayDelivery }
    enum DeliveryStatus { Pending, Confirmed, Processing, Shipped, InTransit, OutForDelivery, Delivered, Failed }
    enum UserRole { None, Farmer, Processor, Distributor, Consumer }

    // ============ Structs ============

    struct FarmerData {
        string variety;
        uint256 quantity;
        uint256 harvestDate;
        string farmLocation;
        string qualityNotes;
        string[] certifications;
        string imageHash;
        uint256 timestamp;
    }

    struct ProcessorData {
        uint256 processingDate;
        string facilityLocation;
        uint256 inputQuantity;
        uint256 outputQuantity;
        string qualityGrade;
        string processingNotes;
        uint256 moistureContent;
        uint256 purityLevel;
        uint256 timestamp;
    }

    struct DistributorData {
        uint256 receivedDate;
        string warehouseLocation;
        string storageConditions;
        uint256 quantity;
        uint256 timestamp;
    }

    struct DeliveryInfo {
        DeliveryMode mode;
        DeliveryStatus status;
        string carrier;
        string trackingNumber;
        uint256 estimatedDelivery;
        uint256 actualDelivery;
        string destinationAddress;
        string recipientName;
        string deliveryNotes;
        uint256 lastUpdated;
    }

    struct Order {
        bytes32 orderId;
        bytes32 batchId;
        address buyer;
        address seller;
        uint256 quantity;
        uint256 price;
        uint256 orderDate;
        OrderStatus status;
        DeliveryInfo delivery;
    }

    struct Batch {
        bytes32 batchId;
        address farmer;
        address processor;
        address distributor;
        uint256 createdAt;
        BatchStatus status;
        bool farmerDataSet;
        bool processorDataSet;
        bool distributorDataSet;
    }

    struct TraceEvent {
        uint256 timestamp;
        address actor;
        UserRole role;
        string action;
        string details;
    }

    // ============ State Variables ============

    mapping(bytes32 => Batch) public batches;
    mapping(bytes32 => FarmerData) public farmerData;
    mapping(bytes32 => ProcessorData) public processorData;
    mapping(bytes32 => DistributorData) public distributorData;
    mapping(bytes32 => TraceEvent[]) public batchEvents;
    mapping(bytes32 => Order) public orders;
    mapping(bytes32 => bytes32[]) public batchOrders; // batchId => orderIds
    mapping(address => UserRole) public userRoles;
    mapping(address => bytes32[]) public userBatches;
    mapping(address => bytes32[]) public userOrders;

    bytes32[] public allBatches;
    uint256 public totalBatches;
    uint256 public totalOrders;

    // ============ Events ============

    event BatchCreated(bytes32 indexed batchId, address indexed farmer, uint256 timestamp);
    event FarmerDataAdded(bytes32 indexed batchId, address indexed farmer, string variety, uint256 quantity, uint256 timestamp);
    event ProcessorDataAdded(bytes32 indexed batchId, address indexed processor, uint256 outputQuantity, string qualityGrade, uint256 timestamp);
    event DistributorDataAdded(bytes32 indexed batchId, address indexed distributor, string warehouseLocation, uint256 timestamp);
    event BatchStatusUpdated(bytes32 indexed batchId, BatchStatus oldStatus, BatchStatus newStatus, uint256 timestamp);
    event TraceEventAdded(bytes32 indexed batchId, address indexed actor, string action, uint256 timestamp);
    
    event OrderCreated(bytes32 indexed orderId, bytes32 indexed batchId, address indexed buyer, address seller, uint256 quantity, uint256 timestamp);
    event OrderStatusUpdated(bytes32 indexed orderId, OrderStatus oldStatus, OrderStatus newStatus, uint256 timestamp);
    event DeliveryModeSet(bytes32 indexed orderId, DeliveryMode mode, uint256 timestamp);
    event DeliveryStatusUpdated(bytes32 indexed orderId, DeliveryStatus oldStatus, DeliveryStatus newStatus, uint256 timestamp);
    event DeliveryConfirmed(bytes32 indexed orderId, address indexed buyer, uint256 timestamp);

    // ============ Modifiers ============

    modifier onlyFarmer() {
        require(userRoles[msg.sender] == UserRole.Farmer, "Not a registered farmer");
        _;
    }

    modifier onlyProcessor() {
        require(userRoles[msg.sender] == UserRole.Processor, "Not a registered processor");
        _;
    }

    modifier onlyDistributor() {
        require(userRoles[msg.sender] == UserRole.Distributor, "Not a registered distributor");
        _;
    }

    modifier batchExists(bytes32 _batchId) {
        require(batches[_batchId].createdAt != 0, "Batch does not exist");
        _;
    }

    modifier orderExists(bytes32 _orderId) {
        require(orders[_orderId].orderDate != 0, "Order does not exist");
        _;
    }

    // ============ Registration Functions ============

    function registerUser(UserRole _role) external {
        require(_role != UserRole.None, "Invalid role");
        require(userRoles[msg.sender] == UserRole.None, "Already registered");
        userRoles[msg.sender] = _role;
    }

    function getUserRole(address _user) external view returns (UserRole) {
        return userRoles[_user];
    }

    // ============ Batch Functions ============

    function createBatch() external onlyFarmer returns (bytes32) {
        bytes32 batchId = keccak256(abi.encodePacked(msg.sender, block.timestamp, totalBatches));
        
        batches[batchId] = Batch({
            batchId: batchId,
            farmer: msg.sender,
            processor: address(0),
            distributor: address(0),
            createdAt: block.timestamp,
            status: BatchStatus.Created,
            farmerDataSet: false,
            processorDataSet: false,
            distributorDataSet: false
        });

        allBatches.push(batchId);
        userBatches[msg.sender].push(batchId);
        totalBatches++;

        _addTraceEvent(batchId, "Batch created by farmer");
        
        emit BatchCreated(batchId, msg.sender, block.timestamp);
        return batchId;
    }

    function addFarmerData(
        bytes32 _batchId,
        string calldata _variety,
        uint256 _quantity,
        uint256 _harvestDate,
        string calldata _farmLocation,
        string calldata _qualityNotes,
        string[] calldata _certifications,
        string calldata _imageHash
    ) external onlyFarmer batchExists(_batchId) {
        Batch storage batch = batches[_batchId];
        require(batch.farmer == msg.sender, "Not the batch owner");
        require(!batch.farmerDataSet, "Farmer data already set");

        farmerData[_batchId] = FarmerData({
            variety: _variety,
            quantity: _quantity,
            harvestDate: _harvestDate,
            farmLocation: _farmLocation,
            qualityNotes: _qualityNotes,
            certifications: _certifications,
            imageHash: _imageHash,
            timestamp: block.timestamp
        });

        batch.farmerDataSet = true;
        
        _addTraceEvent(_batchId, string(abi.encodePacked("Harvest data added: ", _variety, " - ", _uint2str(_quantity), "kg")));
        
        emit FarmerDataAdded(_batchId, msg.sender, _variety, _quantity, block.timestamp);
    }

    function addProcessorData(
        bytes32 _batchId,
        string calldata _facilityLocation,
        uint256 _inputQuantity,
        uint256 _outputQuantity,
        string calldata _qualityGrade,
        string calldata _processingNotes,
        uint256 _moistureContent,
        uint256 _purityLevel
    ) external onlyProcessor batchExists(_batchId) {
        require(batches[_batchId].farmerDataSet, "Farmer data not set yet");
        require(!batches[_batchId].processorDataSet, "Processor data already set");

        batches[_batchId].processor = msg.sender;
        batches[_batchId].processorDataSet = true;
        batches[_batchId].status = BatchStatus.Processed;
        
        _setProcessorData(_batchId, _facilityLocation, _inputQuantity, _outputQuantity, _qualityGrade, _processingNotes, _moistureContent, _purityLevel);
        
        userBatches[msg.sender].push(_batchId);
        _addTraceEvent(_batchId, "Processed into Plantain Flour");
        
        emit ProcessorDataAdded(_batchId, msg.sender, _outputQuantity, _qualityGrade, block.timestamp);
        emit BatchStatusUpdated(_batchId, BatchStatus.Created, BatchStatus.Processed, block.timestamp);
    }

    function _setProcessorData(
        bytes32 _batchId,
        string calldata _facilityLocation,
        uint256 _inputQuantity,
        uint256 _outputQuantity,
        string calldata _qualityGrade,
        string calldata _processingNotes,
        uint256 _moistureContent,
        uint256 _purityLevel
    ) internal {
        processorData[_batchId] = ProcessorData({
            processingDate: block.timestamp,
            facilityLocation: _facilityLocation,
            inputQuantity: _inputQuantity,
            outputQuantity: _outputQuantity,
            qualityGrade: _qualityGrade,
            processingNotes: _processingNotes,
            moistureContent: _moistureContent,
            purityLevel: _purityLevel,
            timestamp: block.timestamp
        });
    }

    function addDistributorData(
        bytes32 _batchId,
        string calldata _warehouseLocation,
        string calldata _storageConditions,
        uint256 _quantity
    ) external onlyDistributor batchExists(_batchId) {
        Batch storage batch = batches[_batchId];
        require(batch.processorDataSet, "Processor data not set yet");
        require(!batch.distributorDataSet, "Distributor data already set");

        batch.distributor = msg.sender;
        
        distributorData[_batchId] = DistributorData({
            receivedDate: block.timestamp,
            warehouseLocation: _warehouseLocation,
            storageConditions: _storageConditions,
            quantity: _quantity,
            timestamp: block.timestamp
        });

        batch.distributorDataSet = true;
        batch.status = BatchStatus.Distributed;
        userBatches[msg.sender].push(_batchId);

        _addTraceEvent(_batchId, string(abi.encodePacked("Received at warehouse: ", _warehouseLocation)));
        
        emit DistributorDataAdded(_batchId, msg.sender, _warehouseLocation, block.timestamp);
        emit BatchStatusUpdated(_batchId, BatchStatus.Processed, BatchStatus.Distributed, block.timestamp);
    }

    // ============ Order Functions ============

    function createOrder(
        bytes32 _batchId,
        address _seller,
        uint256 _quantity,
        uint256 _price
    ) external batchExists(_batchId) returns (bytes32) {
        require(_seller != address(0), "Invalid seller");
        require(_quantity > 0, "Invalid quantity");

        bytes32 orderId = keccak256(abi.encodePacked(msg.sender, _batchId, block.timestamp, totalOrders));

        orders[orderId] = Order({
            orderId: orderId,
            batchId: _batchId,
            buyer: msg.sender,
            seller: _seller,
            quantity: _quantity,
            price: _price,
            orderDate: block.timestamp,
            status: OrderStatus.Placed,
            delivery: DeliveryInfo({
                mode: DeliveryMode.StandardDelivery,
                status: DeliveryStatus.Pending,
                carrier: "",
                trackingNumber: "",
                estimatedDelivery: 0,
                actualDelivery: 0,
                destinationAddress: "",
                recipientName: "",
                deliveryNotes: "",
                lastUpdated: block.timestamp
            })
        });

        batchOrders[_batchId].push(orderId);
        userOrders[msg.sender].push(orderId);
        userOrders[_seller].push(orderId);
        totalOrders++;

        _addTraceEvent(_batchId, string(abi.encodePacked("Order placed: ", _uint2str(_quantity), "kg")));

        emit OrderCreated(orderId, _batchId, msg.sender, _seller, _quantity, block.timestamp);
        return orderId;
    }

    function setDeliveryMode(
        bytes32 _orderId,
        DeliveryMode _mode,
        string calldata _destinationAddress,
        string calldata _recipientName
    ) external orderExists(_orderId) {
        Order storage order = orders[_orderId];
        require(order.buyer == msg.sender, "Not the buyer");
        require(order.status == OrderStatus.Placed || order.status == OrderStatus.Confirmed, "Cannot change delivery mode");

        order.delivery.mode = _mode;
        order.delivery.destinationAddress = _destinationAddress;
        order.delivery.recipientName = _recipientName;
        order.delivery.lastUpdated = block.timestamp;

        emit DeliveryModeSet(_orderId, _mode, block.timestamp);
    }

    function updateOrderStatus(bytes32 _orderId, OrderStatus _newStatus) external orderExists(_orderId) {
        Order storage order = orders[_orderId];
        require(order.seller == msg.sender || order.buyer == msg.sender, "Not authorized");
        
        OrderStatus oldStatus = order.status;
        order.status = _newStatus;

        _addTraceEvent(order.batchId, string(abi.encodePacked("Order status updated to: ", _orderStatusToString(_newStatus))));

        emit OrderStatusUpdated(_orderId, oldStatus, _newStatus, block.timestamp);
    }

    function updateDeliveryStatus(
        bytes32 _orderId,
        DeliveryStatus _newStatus,
        string calldata _carrier,
        string calldata _trackingNumber,
        uint256 _estimatedDelivery,
        string calldata _notes
    ) external orderExists(_orderId) {
        require(orders[_orderId].seller == msg.sender || userRoles[msg.sender] == UserRole.Distributor, "Not authorized");

        DeliveryStatus oldStatus = orders[_orderId].delivery.status;
        _updateDeliveryInfo(_orderId, _newStatus, _carrier, _trackingNumber, _estimatedDelivery, _notes);

        // Update batch status based on delivery
        if (_newStatus == DeliveryStatus.Shipped || _newStatus == DeliveryStatus.InTransit) {
            batches[orders[_orderId].batchId].status = BatchStatus.InTransit;
        }

        _addTraceEvent(orders[_orderId].batchId, "Delivery status updated");
        emit DeliveryStatusUpdated(_orderId, oldStatus, _newStatus, block.timestamp);
    }

    function _updateDeliveryInfo(
        bytes32 _orderId,
        DeliveryStatus _newStatus,
        string calldata _carrier,
        string calldata _trackingNumber,
        uint256 _estimatedDelivery,
        string calldata _notes
    ) internal {
        orders[_orderId].delivery.status = _newStatus;
        orders[_orderId].delivery.lastUpdated = block.timestamp;
        if (bytes(_carrier).length > 0) orders[_orderId].delivery.carrier = _carrier;
        if (bytes(_trackingNumber).length > 0) orders[_orderId].delivery.trackingNumber = _trackingNumber;
        if (_estimatedDelivery > 0) orders[_orderId].delivery.estimatedDelivery = _estimatedDelivery;
        if (bytes(_notes).length > 0) orders[_orderId].delivery.deliveryNotes = _notes;
    }

    function confirmDelivery(bytes32 _orderId) external orderExists(_orderId) {
        Order storage order = orders[_orderId];
        require(order.buyer == msg.sender, "Not the buyer");
        require(order.delivery.status == DeliveryStatus.OutForDelivery || order.delivery.status == DeliveryStatus.InTransit, "Not ready for confirmation");

        order.delivery.status = DeliveryStatus.Delivered;
        order.delivery.actualDelivery = block.timestamp;
        order.delivery.lastUpdated = block.timestamp;
        order.status = OrderStatus.Delivered;

        batches[order.batchId].status = BatchStatus.Delivered;

        _addTraceEvent(order.batchId, "Delivery confirmed by buyer");

        emit DeliveryConfirmed(_orderId, msg.sender, block.timestamp);
        emit DeliveryStatusUpdated(_orderId, DeliveryStatus.OutForDelivery, DeliveryStatus.Delivered, block.timestamp);
    }

    // ============ View Functions ============

    function getBatchDetails(bytes32 _batchId) external view batchExists(_batchId) returns (
        Batch memory batch,
        FarmerData memory farmer,
        ProcessorData memory processor,
        DistributorData memory distributor
    ) {
        return (
            batches[_batchId],
            farmerData[_batchId],
            processorData[_batchId],
            distributorData[_batchId]
        );
    }

    function getBatchHistory(bytes32 _batchId) external view batchExists(_batchId) returns (TraceEvent[] memory) {
        return batchEvents[_batchId];
    }

    function getOrderDetails(bytes32 _orderId) external view orderExists(_orderId) returns (Order memory) {
        return orders[_orderId];
    }

    function getBatchOrders(bytes32 _batchId) external view returns (bytes32[] memory) {
        return batchOrders[_batchId];
    }

    function getUserBatches(address _user) external view returns (bytes32[] memory) {
        return userBatches[_user];
    }

    function getUserOrders(address _user) external view returns (bytes32[] memory) {
        return userOrders[_user];
    }

    function getAllBatches() external view returns (bytes32[] memory) {
        return allBatches;
    }

    function trackDelivery(bytes32 _orderId) external view orderExists(_orderId) returns (DeliveryInfo memory) {
        return orders[_orderId].delivery;
    }

    // ============ Internal Functions ============

    function _addTraceEvent(bytes32 _batchId, string memory _action) internal {
        batchEvents[_batchId].push(TraceEvent({
            timestamp: block.timestamp,
            actor: msg.sender,
            role: userRoles[msg.sender],
            action: _action,
            details: ""
        }));

        emit TraceEventAdded(_batchId, msg.sender, _action, block.timestamp);
    }

    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    function _orderStatusToString(OrderStatus _status) internal pure returns (string memory) {
        if (_status == OrderStatus.Placed) return "Placed";
        if (_status == OrderStatus.Confirmed) return "Confirmed";
        if (_status == OrderStatus.Processing) return "Processing";
        if (_status == OrderStatus.Shipped) return "Shipped";
        if (_status == OrderStatus.Delivered) return "Delivered";
        if (_status == OrderStatus.Completed) return "Completed";
        if (_status == OrderStatus.Cancelled) return "Cancelled";
        if (_status == OrderStatus.Refunded) return "Refunded";
        return "Unknown";
    }

    function _deliveryStatusToString(DeliveryStatus _status) internal pure returns (string memory) {
        if (_status == DeliveryStatus.Pending) return "Pending";
        if (_status == DeliveryStatus.Confirmed) return "Confirmed";
        if (_status == DeliveryStatus.Processing) return "Processing";
        if (_status == DeliveryStatus.Shipped) return "Shipped";
        if (_status == DeliveryStatus.InTransit) return "In Transit";
        if (_status == DeliveryStatus.OutForDelivery) return "Out for Delivery";
        if (_status == DeliveryStatus.Delivered) return "Delivered";
        if (_status == DeliveryStatus.Failed) return "Failed";
        return "Unknown";
    }
}
