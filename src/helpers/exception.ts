export class Exception extends Error{
    statusCode: number;
    shoudlAck: string;
    constructor(error: string, statusCode: number, shoudlAck = "success"){
        super(error)

        this.statusCode = statusCode || 500
        this.shoudlAck = shoudlAck
    }
}