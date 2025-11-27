const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PlantainTraceability", function () {
  let contract;
  let owner, farmer, processor, distributor, consumer;

  beforeEach(async function () {
    [owner, farmer, processor, distributor, consumer] = await ethers.getSigners();
    
    const PlantainTraceability = await ethers.getContractFactory("PlantainTraceability");
    contract = await PlantainTraceability.deploy();
    await contract.waitForDeployment();

    // Register users
    await contract.connect(farmer).registerUser(1); // Farmer
    await contract.connect(processor).registerUser(2); // Processor
    await contract.connect(distributor).registerUser(3); // Distributor
    await contract.connect(consumer).registerUser(4); // Consumer
  });

  describe("User Registration", function () {
    it("Should register users with correct roles", async function () {
      expect(await contract.getUserRole(farmer.address)).to.equal(1);
      expect(await contract.getUserRole(processor.address)).to.equal(2);
      expect(await contract.getUserRole(distributor.address)).to.equal(3);
      expect(await contract.getUserRole(consumer.address)).to.equal(4);
    });

    it("Should not allow double registration", async function () {
      await expect(contract.connect(farmer).registerUser(1))
        .to.be.revertedWith("Already registered");
    });
  });

  describe("Batch Creation", function () {
    it("Should allow farmer to create a batch", async function () {
      const tx = await contract.connect(farmer).createBatch();
      const receipt = await tx.wait();
      
      expect(await contract.totalBatches()).to.equal(1);
      
      const batches = await contract.getUserBatches(farmer.address);
      expect(batches.length).to.equal(1);
    });

    it("Should not allow non-farmer to create batch", async function () {
      await expect(contract.connect(processor).createBatch())
        .to.be.revertedWith("Not a registered farmer");
    });
  });

  describe("Full Supply Chain Flow", function () {
    let batchId;

    beforeEach(async function () {
      // Create batch
      const tx = await contract.connect(farmer).createBatch();
      const receipt = await tx.wait();
      const batches = await contract.getUserBatches(farmer.address);
      batchId = batches[0];
    });

    it("Should complete full traceability flow", async function () {
      // 1. Farmer adds data
      await contract.connect(farmer).addFarmerData(
        batchId,
        "French Horn",
        1000, // 1000 kg
        Math.floor(Date.now() / 1000),
        "Lagos, Nigeria",
        "Premium quality plantain",
        ["Organic", "Fair Trade"],
        "QmHash123"
      );

      // 2. Processor adds data
      await contract.connect(processor).addProcessorData(
        batchId,
        "Ikeja Processing Facility",
        1000, // input
        850,  // output (85% yield)
        "A+",
        "Processed using modern equipment",
        12,   // moisture content
        98    // purity level
      );

      // 3. Distributor adds data
      await contract.connect(distributor).addDistributorData(
        batchId,
        "Victoria Island Warehouse",
        "Temperature controlled, 20-25°C",
        850
      );

      // Verify batch details
      const [batch, farmerData, processorData, distributorData] = await contract.getBatchDetails(batchId);
      
      expect(batch.farmer).to.equal(farmer.address);
      expect(batch.processor).to.equal(processor.address);
      expect(batch.distributor).to.equal(distributor.address);
      expect(batch.status).to.equal(2); // Distributed
      
      expect(farmerData.variety).to.equal("French Horn");
      expect(farmerData.quantity).to.equal(1000);
      
      expect(processorData.outputQuantity).to.equal(850);
      expect(processorData.qualityGrade).to.equal("A+");
      
      expect(distributorData.warehouseLocation).to.equal("Victoria Island Warehouse");
    });

    it("Should track batch history", async function () {
      await contract.connect(farmer).addFarmerData(
        batchId,
        "Agbagba",
        500,
        Math.floor(Date.now() / 1000),
        "Ogun State",
        "Good quality",
        [],
        ""
      );

      const history = await contract.getBatchHistory(batchId);
      expect(history.length).to.be.greaterThan(0);
    });
  });

  describe("Order and Delivery", function () {
    let batchId;

    beforeEach(async function () {
      // Setup batch with all data
      const tx = await contract.connect(farmer).createBatch();
      const batches = await contract.getUserBatches(farmer.address);
      batchId = batches[0];

      await contract.connect(farmer).addFarmerData(
        batchId, "French Horn", 1000, Math.floor(Date.now() / 1000),
        "Lagos", "Good", [], ""
      );

      await contract.connect(processor).addProcessorData(
        batchId, "Facility", 1000, 850, "A", "Notes", 12, 98
      );

      await contract.connect(distributor).addDistributorData(
        batchId, "Warehouse", "Good conditions", 850
      );
    });

    it("Should create and track order", async function () {
      // Create order
      const tx = await contract.connect(consumer).createOrder(
        batchId,
        distributor.address,
        50, // 50 kg
        ethers.parseEther("0.1") // price
      );
      
      const orders = await contract.getUserOrders(consumer.address);
      expect(orders.length).to.equal(1);
      
      const orderId = orders[0];
      const order = await contract.getOrderDetails(orderId);
      
      expect(order.buyer).to.equal(consumer.address);
      expect(order.seller).to.equal(distributor.address);
      expect(order.quantity).to.equal(50);
      expect(order.status).to.equal(0); // Placed
    });

    it("Should update delivery status", async function () {
      // Create order
      await contract.connect(consumer).createOrder(
        batchId, distributor.address, 50, ethers.parseEther("0.1")
      );
      
      const orders = await contract.getUserOrders(consumer.address);
      const orderId = orders[0];

      // Set delivery mode
      await contract.connect(consumer).setDeliveryMode(
        orderId,
        2, // ExpressDelivery
        "123 Main St, Lagos",
        "John Doe"
      );

      // Update delivery status
      await contract.connect(distributor).updateDeliveryStatus(
        orderId,
        3, // Shipped
        "DHL",
        "DHL123456",
        Math.floor(Date.now() / 1000) + 86400, // tomorrow
        "Package dispatched"
      );

      const delivery = await contract.trackDelivery(orderId);
      expect(delivery.status).to.equal(3); // Shipped
      expect(delivery.carrier).to.equal("DHL");
      expect(delivery.trackingNumber).to.equal("DHL123456");
    });

    it("Should allow buyer to confirm delivery", async function () {
      // Create and process order
      await contract.connect(consumer).createOrder(
        batchId, distributor.address, 50, ethers.parseEther("0.1")
      );
      
      const orders = await contract.getUserOrders(consumer.address);
      const orderId = orders[0];

      // Update to out for delivery
      await contract.connect(distributor).updateDeliveryStatus(
        orderId, 5, "", "", 0, "" // OutForDelivery
      );

      // Confirm delivery
      await contract.connect(consumer).confirmDelivery(orderId);

      const order = await contract.getOrderDetails(orderId);
      expect(order.status).to.equal(4); // Delivered
      expect(order.delivery.status).to.equal(6); // Delivered
    });
  });
});
