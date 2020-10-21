const serverless = require('serverless-http')
const server = require('./server')

// We need to define our function name for express routes to set the correct base path
// const functionName = 'serverless-http'

// Initialize express app
// const app = expressApp(functionName)

// Export lambda handler
console.log('Welcome to my Serverless function')
exports.handler = serverless(server)
