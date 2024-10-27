const corsOptions={
    origin:["http://localhost:5173","http://localhost:4173",process.env.CLIENT_URL],
    methods:["GET","POST","PUT","DELETE"],
    transports:['websocket'],
    credentials:true,
};

const CONNECT_HUB="ConnectHub-token";
export {corsOptions,CONNECT_HUB};