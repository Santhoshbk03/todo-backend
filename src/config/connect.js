import {Pool } from "pg"



const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false, // REQUIRED for Neon
  },
});



pool.on("connect",()=>{
    console.log("pg connected")
})


pool.on("error",()=>{
    console.log("pg error");
})


export default pool;