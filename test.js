const mongoose = require("mongoose");
const dns = require('dns').promises;

const testConnection = async () => {
  try {
    console.log("Resolving SRV records manually...");
    
    // Manually resolve SRV to get the actual hostnames
    const srvRecords = await dns.resolveSrv('_mongodb._tcp.mw-cluster.mlwbo96.mongodb.net');
    console.log("SRV Records found:", srvRecords);
    
    // Build direct connection string from SRV results
    const hosts = srvRecords.map(r => `${r.name}:${r.port}`).join(',');
    const uri = `mongodb://${hosts}/pos_red_cherry?authSource=admin&ssl=true`;
    
    console.log("Connecting to:", uri);
    
    await mongoose.connect(uri, {
      auth: {
        username: 'kushwahavicky15',
        password: 'Viram%23123'
      }
    });
    
    console.log("✅ MongoDB connected successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    
    // If manual SRV fails, try the direct hostnames
    console.log("\nTrying direct connection...");
    try {
      const directUri = "mongodb://mw-cluster-shard-00-00.mlwbo96.mongodb.net:27017,mw-cluster-shard-00-01.mlwbo96.mongodb.net:27017,mw-cluster-shard-00-02.mlwbo96.mongodb.net:27017/pos_red_cherry?authSource=admin&ssl=true";
      
      await mongoose.connect(directUri, {
        auth: {
          username: 'kushwahavicky15',
          password: 'Viram%23123'
        }
      });
      
      console.log("✅ MongoDB connected successfully with direct connection!");
      process.exit(0);
    } catch (err2) {
      console.error("❌ Direct connection also failed:", err2.message);
      process.exit(1);
    }
  }
};

testConnection();