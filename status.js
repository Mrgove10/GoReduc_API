exports.handler = async (event) => {
    const response = {
        statusCode: 200,
        staus: "UP",
        serverTime: new Date() 
    };
    return response;
};
