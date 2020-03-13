exports.handler = async () => {
    return {
        statusCode: 200,
        staus: "UP",
        serverTime: new Date() 
    };
};
