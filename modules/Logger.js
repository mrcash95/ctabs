//Initialize the global CTabs namespace
CTabs= chrome.extension.getBackgroundPage().CTabs;

/**
 <p>The Logger class offers a central facility to log messages to. The Logger accepts
 log observers, which are responsible of actually processing the messages.</p>
 @class

 @property {Array} observers A list of observers who are notified when a new message arrives
*/
CTabs.Logger = new function () {
    this.severity = {
        'DEBUG': 0,
        'DEBUGERROR': 1,
        'TEST': 2, //Meant for running test cases without debug output
        'INFO': 3,
        'WARN': 4,
        'ERROR': 5
    };

    this.severityNames = ['DEBUG', 'DEBUGERROR', 'TEST', 'INFO', 'WARN', 'ERROR'];
}


/**
 @description
 <p>Logs a new message with severity level DEBUG.</p>
 
 @param {String} message The message that needs to be logged
*/
CTabs.Logger.debug = function (message) {
    CTabs.Logger._logMessage(message, this.severity.DEBUG);
}

/**
 @description
 <p>Logs a new message with severity level DEBUGERROR. This level is meant
 to display errors during debugging, but not during normal execution. </p>
 
 @param {String} message The message that needs to be logged
*/
CTabs.Logger.debugerror = function (message) {
    CTabs.Logger._logMessage(message, this.severity.DEBUGERROR);
}

/**
 @description
 <p>Logs a new message with severity level TEST.</p>
 
 @param {String} message The message that needs to be logged
*/
CTabs.Logger.test = function (message) {
    CTabs.Logger._logMessage(message, this.severity.TEST);
}

/**
 @description
 <p>Logs a new message with severity level INFO.</p>
 
 @param {String} message The message that needs to be logged
*/
CTabs.Logger.info = function (message) {
    CTabs.Logger._logMessage(message, this.severity.INFO);
}

/**
 @description
 <p>Logs a new message with severity level WARN.</p>
 
 @param {String} message The message that needs to be logged
*/
CTabs.Logger.warn = function (message) {
    CTabs.Logger._logMessage(message, this.severity.WARN);
}

/**
 @description
 <p>Logs a new message with severity level ERROR.</p>
 
 @param {String} message The message that needs to be logged
*/
CTabs.Logger.error = function (message) {
    CTabs.Logger._logMessage(message, this.severity.ERROR);
}


/**
 @private
 @description
 <p>Sends a <code>LogMessage</code> to all registered observers</p>
 
 @param {String} message The message that needs to be logged
 @param {Integer} severity The severity of the message to log
*/
CTabs.Logger._logMessage = function (message, severity) {
    switch (severity) {
        case CTabs.Logger.severity.DEBUG:
        case CTabs.Logger.severity.TEST:
        case CTabs.Logger.severity.INFO:
            console.log(message);
            break;
        case CTabs.Logger.severity.WARN:
            console.warn(message);
            break;
        case CTabs.Logger.severity.ERROR:
        case CTabs.Logger.severity.DEBUGERROR:
            console.error(message);
            break;
    }
}