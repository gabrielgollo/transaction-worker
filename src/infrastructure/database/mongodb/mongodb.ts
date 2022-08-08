import mongoose, { Connection } from "mongoose";

const { MONGO_URI } = process.env

class MongoDb{
    private connection: Connection | null;
    constructor(){
        this.connection = null;
    }

    private createConnection(): Connection{
        return mongoose.createConnection(MONGO_URI as string)
    }

    public getOrCreateConnection(){
        if(this.connection) return this.connection;
        const connection = this.createConnection();
        if(!connection) throw new Error('Connection is null');
        return connection;
    }
}

const mongoDb = new MongoDb();

export default mongoDb