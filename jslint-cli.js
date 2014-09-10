/**
 * JSLint wrapper - wraps JSLint for CLI (commandline) usage in Node.JS.
 * Adds recursive folder checking, asynchronous & concurrent checking of multiple files.
 * Adds formatted reports and report values (like lines of codes) for white box test tracking.
 *
 * @author Neon
 **/

//JSLint static code analysis options
/*jslint node:true, nomen:true, sloppy:true, plusplus:true, maxerr:10, indent:4, stupid:true, ass:true, white:true */
/*global JSLINT:true */

(function (exports /*, global*/) {

var fs = require('fs'),
    util = require('util'),
    path = require("path"),

    nopt = require('nopt'),
    //Declare our commandline options for folder checks
    knownOpts = {
        //Report options available for checkAsync():
        "jslinthtml" : Boolean      //request to generate HTML reports for each file checked; save path is 'jslint_reports' folder
        , "jslintsummary" : Boolean //request to generate CSV summary for folder check; saved to 'jslint_reports/summary.csv'
        , "jslintcheck": [path, Array]  //request to check these paths in CLI mode
        //Request to watch given file and provide live JSLint checking.
        //  jslinthtml & jslintsummary are not applicable to watches.
        , "jslintwatch": path
        , "jslintcolor" : Boolean   //request to enable or disable use of colours in watch printout (default: enabled/true)
        , "jslinthidepath" : Boolean   //request not to print file path in watch printout (default: enabled/true; e.g. for jumping to error in Textpad)

        //Options in JSLint to be set (anything else not specified remains as per JSLint defaults)
        , "jslintoption": String    //provide path to JSON file containing JSLint options (will be read 1st)
        , "jslintenable": [String, Array]   //JSLint options to set to true
        , "jslintdisable": [String, Array]   //JSLint options to set to false
        , "jslintindent": Number    //JSLint option: indentation factor
        , "jslintmaxerr": Number    //JSLint option: maximum number of errors to allow
        , "jslintmaxlen": Number    //JSLint option: maximum length of a source line
        , "jslintglobal": [String, Array]   //JS option: add a global pre-definition
        },
    //1. Parse commandline options
    parsedOpts = nopt(knownOpts, {}, process.argv, 2),

    //2. Read jslint.js
    jslintCode = fs.readFileSync(__dirname + '/jslint.js', 'utf8'),
    dummy = function() { console.log('WRN: JSLint unavailable!'); };

if (jslintCode)
{
    //3A. Insert code fragment to store the lines of codes (JSLINT.loc)
    jslintCode = jslintCode.replace(/(lex\.init\(the_source\);)/, '$1 JSLINT.loc = lines.length; JSLINT.options = option;');
    //3B. Insert code fragment to add <undef> option to ignore typedef comparison to 'undefined'.
    jslintCode = jslintCode.replace(/(var\s+allowed_option\s*=\s*\{)/, "$1\n\tundef: true,");
    jslintCode = jslintCode.replace(/if\s*\(\s*((left|right)\s*\.string\s*===\s*'undefined'\s*\|\|\s*\2\.string\s*===\s*'null')(\s*\)\s*\{\s*(left|right)\s*\.\s*warn\s*\(\s*"unexpected_typeof_a"\s*,\s*\2\.string\s*\)\s*;)/g,
        "if (!option.undef && ($1)$3");

    //4. Evaluate jslint.js
    /*jslint evil: true */
    eval(jslintCode); //jslint.js is known to be safe
    /*jslint evil: false */

    //5. Setup our exports (with additional features)
    exports.JSLINT = JSLINT;
    exports.optionsOrg = {};    //master copy of all JSLint options passed in via commandline
    exports.options = {};       //working copy for use in each JSLINT call

    require('colors').setTheme({
        silly: 'rainbow',
        input: 'grey',
        verbose: 'cyan',
        prompt: 'grey',
        info: 'green',
        data: 'grey',
        help: 'cyan',
        warn: 'yellow',
        debug: 'blue',
        error: 'red'
    });

    /**
     * (Internal Use)
     * Determine if given path is one of supported file types/extensions.
     * Supported file extensions are:
     *   htm, html, js, json
     * Also forces JSLint 'browser' option to 'true' for webpages.
     *
     * @param filePath (string) path to be checked
     * @return (boolean) true if is supported type; false o.w.
     **/
    exports.isSupportedFiletype = function(filePath) {
        var ext = path.extname(filePath).toLowerCase();
        if ( (ext === '.js') || (ext === '.json') )
        {
            return true;
        }
        if ( (ext === '.html') || (ext === '.htm') )
        {
            //override 'browser' option to 'true' for webpage
            exports.options.browser = true;
            return true;
        }
        return  false;
    };

    /**
     * (Internal Use)
     * Determine if given path is a webpage, i.e. have extension:
     *   htm or html
     * @param filePath (string) path to be checked
     * @return (boolean) true if is webpage; false o.w.
     **/
    exports.isWebpage = function(filePath) {
        var ext = path.extname(filePath).toLowerCase();
        return (ext === '.html') || (ext === '.htm');
    };

    /**
     * JSLint the given file sychronously
     * @param filePath (string) path to a file
     * @param print (boolean) whether to print results to console
     * @return (boolean) true if no errors found; false o.w.
     *                   Inspect the .errors object if needed.
     **/
    exports.checkFile = function(filePath, print) {
        console.log('Check file: ' + filePath);
        if (fs.existsSync(filePath))
        {
            var s = fs.statSync(filePath), data, ok;
            if (s && s.isFile())
            {
                if (exports.isSupportedFiletype(filePath))
                {
                    data = fs.readFileSync(filePath);
                    if (data)
                    {
                        ok = exports.JSLINT(data.toString(), exports.options);
                        if (print)
                        {
                            console.log('JSLint ' + (ok? 'OK: ': 'Found errors in: ') + filePath);
                            //console.log(JSLINT.errors);   //print without 'syntax highlighting'
                            console.log(util.inspect(JSLINT.errors, true, 1, true)); //print with 'syntax highlighting'
                        }
                        return ok;
                    }
                }
                else
                {
                    console.log('WARNING: JSLint skipped file with unsupported extension: ' + filePath);
                    return false;
                }
            }
            else
            {
                console.log('WARNING: JSLint skipped path as it\'s not a file: ' + filePath);
                return false;
            }
        }
        console.log('ERROR: JSLint failed to read file: ' + filePath);
        return false;
    };

    /**
     * JSLint the given file or folder sychronously
     * @param filePath (string) path to a file
     * @param print (boolean) whether to print results to console
     * @return (boolean) true if no errors found; false o.w.
     *                   Inspect the .errors object if needed.
     **/
    exports.check = function(filePath, print) {
        if (fs.existsSync(filePath))
        {
            var s = fs.statSync(filePath), ok,
                files, i, cnt;
            if (s && s.isDirectory())
            {
                files = fs.readdirSync(filePath);
                if (files && files.length > 0)
                {
                    cnt = files.length;
                    for (i = 0; i < cnt; ++i)
                    {
                        ok = exports.check(filePath + filePath.sep + files[i], print) || ok;
                    }
                }
                return ok;
            }
            if (s.isFile())
            {
                return exports.checkFile(filePath, print);
            }
        }
        return false;
    };

    /**
     * JSLint the given file asychronously
     * @param filePath (string) path to a file
     * @param cb (function) callback to return results to.
     *        callback: function(success, errors, path)
     *        where success: (boolean) true if no errors found; false o.w.
     *                       Inspect the .errors object if needed.
     *              errors: is array of JSLint errors if JSLint check was performed,
     *                      or a string indicating reason JSLint was not performed (usually file path errors).
     *              path: path of file that was to be checked.
     **/
    exports.checkFileAsync = function(filePath, cb) {
        fs.exists(filePath, function(exists) {
            if (exists)
            {
                fs.stat(filePath, function(err, s) {
                    if (!err && s.isFile())
                    {
                        if (exports.isSupportedFiletype(filePath))
                        {
                            fs.readFile(filePath, function(err, data) {
                                if (!err)
                                {
                                    var ok = exports.JSLINT(data.toString(), exports.options);
                                    if (typeof cb === 'function')
                                    {
                                        cb(ok, exports.JSLINT.errors, filePath);
                                    }
                                }
                                else
                                {
                                    if (typeof cb === 'function')
                                    {
                                        cb(false, 'cannot read file', filePath);
                                    }
                                }
                            });
                        }
                        else
                        {
                            if (typeof cb === 'function')
                            {
                                cb(false, 'ignored unsupported file type', filePath);
                            }
                        }
                    }
                    else
                    {
                        if (typeof cb === 'function')
                        {
                            cb(false, 'either cannot open file or is not a file', filePath);
                        }
                    }
                });
            }
            else
            {
                if (typeof cb === 'function')
                {
                    cb(false, 'cannot find file', filePath);
                }
            }
        });
    };

    /**
     * JSLint the given file or folder asychronously.
     * If the original path given is a folder, callback is called another time
     * to inform user when the entire folder has been checked.
     *
     * @param filePath (string) path to a file
     * @param cb (function) callback to return results to.
     *        callback: function(success, errors, filePath)
     *        where success: (boolean) true if no errors found; false o.w.
     *                       Inspect the .errors object if needed.
     *                       When an entire folder's files are checked, an additional callback will be made
     *                       with success containing a result object with content as follows:
     *                      {'path': <string, original path to JSLint>,
                             'total': <integer, total no. of files checked>,
     *                       'success': <total no. of files checked with no errors>}
     *              errors: is array of JSLint errors if JSLint check was performed,
     *                      or a string indicating reason JSLint was not performed (usually file path errors).
     *              path: path of file that was to be checked.
     * @param obj (leave it undefined!) for internal use, so do Not pass in anything!
     *            Used internally to monitor the status of a recursive folder check.
     **/
    exports.checkAsync = function(filePath, cb, obj) {
        if (obj === undefined)
        {
            obj = {'cnt': 1, 'cb': cb, 'path': filePath, 'total': 0, 'success': 0};
            cb = function(s, e, p) {
                //update counters
                --obj.cnt;
                ++obj.total;
                if (s)
                {
                    ++obj.success;
                }
                //report individual file
                if (parsedOpts.jslinthtml)
                {
                    if (typeof e !== 'string')
                    {
                        exports.saveHtmlResult(obj.path, p);
                    }
                    else
                    {
                        console.log('WARNING JSLint can\'t process '.bold.warn + p + ': ' + e);
                    }
                }
                //report summary when entire folder has been checked
                if (obj.cnt <= 0)
                {
                    if (parsedOpts.jslintsummary)
                    {
                        exports.saveResult();
                    }
                }

                //make callback(s)
                if (typeof(obj.cb) === 'function')
                {
                    obj.cb(s, e, p); //make original callback
                    //check if entire folder has been checked
                    if (obj.cnt <= 0)
                    {
                        obj.cb({'path': obj.path, 'total': obj.total, 'success': obj.success}, null, null); //notify caller that entire folder has been checked
                    }
                }
            };
        }
        else
        {
            ++obj.cnt;
        }
        fs.exists(filePath, function(exists) {
            if (exists)
            {
                fs.stat(filePath, function(err, s) {
                    if (!err)
                    {
                        if (s.isDirectory())
                        {
                            fs.readdir(filePath, function(err, files) {
                                if (!err)
                                {
                                    var i, cnt;
                                    if (files && files.length > 0)
                                    {
                                        cnt = files.length;
                                        for (i = 0; i < cnt; ++i)
                                        {
                                            exports.checkAsync(filePath + path.sep + files[i], cb, obj);
                                        }
                                    }
                                    --obj.cnt;
                                }
                                else
                                {
                                    if (typeof cb === 'function')
                                    {
                                        cb(false, 'cannot read folder', filePath);
                                    }
                                }
                            });
                        }
                        else if (s.isFile())
                        {
                            exports.checkFileAsync(filePath, cb);
                        }
                    }
                    else
                    {
                        if (typeof cb === 'function')
                        {
                            cb(false, 'cannot open path', filePath);
                        }
                    }
                });
            }
            else
            {
                if (typeof cb === 'function')
                {
                    cb(false, 'cannot find path', filePath);
                }
            }
        });
    };

    /**
     * Convenience function to retrieve the JSLint output
     **/
    exports.getErrors = function() {
        return JSLINT.errors;
    };

    /**
     * (For use with Node-JEWEL bootstrap)
     * Creates WebSocket topic 'jslint' for reporting of JSLint results.
     **/
    exports.createWsChannel = function(io, chName) {
        if ( io && (typeof(io.of) === 'function') )
        {
            chName = chName || 'jslint';
            exports.JSLINT.ws = {
                'chName': chName,
                'ns': io.of(chName)
            };
            if (exports.JSLINT.ws.ns)
            {
                console.log('INF: JSLint WebSocket service created.');
                /*
                exports.JSLINT.ws.ns.on('connection', function(socket) {
                    console.log('INF: JSLint client joined');
                    //socket.join(exports.JSLINT.ws.chName);
                });
                */
                return exports.JSLINT.ws.ns;
            }
            console.log('ERROR: JSLint WebSocket service creation failed.');
        }
    };

    /**
     * Broadcast html report through WebSocket
     **/
    exports.sendReport = function(success, errors, filePath) {
        if ( exports.JSLINT.ws && exports.JSLINT.ws.ns.manager.rooms[exports.JSLINT.ws.chName]
            && (exports.JSLINT.ws.ns.manager.rooms[exports.JSLINT.ws.chName].length > 0) )
        {
            var rpt, rptErr, repProp, cntErr;
            if (typeof errors !== 'string')
            {
                rpt = exports.JSLINT.report(exports.JSLINT.data());
                rptErr = exports.JSLINT.error_report(exports.JSLINT.data());
                repProp = exports.JSLINT.properties_report(exports.JSLINT.property);
                cntErr = errors.length;
            }
            else
            {
                rptErr = errors;
            }
            exports.JSLINT.ws.ns.volatile.emit('result', {
                'path': filePath,
                'success': success,
                'report': rpt,
                'error_report': rptErr,
                'properties_report': repProp,
                'num_errors': cntErr
            });
            console.log('INF: JSLint report broadcasted on WebSocket for: ' + filePath);
        }
        else
        {
            console.log('ERROR: JSLint WebSocket service not available or no clients connected.');
        }
    };

    //Convenience functions to retrieve reports
    exports.getErrors = function()
    {
        return exports.JSLINT.errors;
    };

    exports.getNumErrors = function()
    {
        if (exports.JSLINT.errors)
        {
            var jslintData = exports.JSLINT.data();
            if (jslintData && jslintData.unused && jslintData.unused.length > 0)
            {
                return exports.JSLINT.errors.length + jslintData.unused.length;
            }
            return exports.JSLINT.errors.length;
        }
        return 0;
    };

    exports.getLoc = function()
    {
        return exports.JSLINT.loc || 0;
    };

    exports.getScannedLoc = function()
    {
        if (typeof(exports.JSLINT.tree) === 'string')
        {
            if (exports.JSLINT.data().json === true)
            {
                //Known issue: check if JSON scanning will ever be incomplete owing to excessive errors;
                // for now, assume it won't, so just pretend that all LOCs are scanned.
                return exports.getLoc();
            }
            //JSLint performed but did not complete owing to errors
            if (exports.JSLINT.errors && (exports.JSLINT.errors.length >= 2))
            {
                //return the line number of last line scanned
                return exports.JSLINT.errors[exports.JSLINT.errors.length - 2].line;
            }
            return 0;
        }
        //o.w. JSLint either didn't run or had completed successfully without errors, so return LOC
        return exports.getLoc();
    };

    exports.getReport = function()
    {
        return exports.JSLINT.report(exports.JSLINT.data());
    };

    exports.getErrorReport = function()
    {
        return exports.JSLINT.error_report(exports.JSLINT.data());
    };

    exports.getTree = function() {
        return JSON.stringify(exports.JSLINT.tree, [
         'string',  'arity', 'name',  'first',
         'second', 'third', 'block', 'else'
        ], 4);
    };

    /**
     * (Internal Use)
     * Generate a formatted date string of current time
     * in the format: dd/mm/yyyy
     **/
    exports.getCurrentDate = function() {
        //new Date return format: Fri Jul 27 2012 10:24:17 GMT+0800 (Malay Peninsula Standard Time)
        var today = new Date();
        return today.getDate() + '\/' + (today.getMonth() + 1) + '\/' + (today.getYear() + 1900);
    };


    /**
     * (Internal Use)
     * Generate a formatted date-time string of current time
     * in the format: dd/mm/yyyy hh:mm:ss
     **/
    exports.getCurrentDateTime = function() {
        function pad2Digits(num)
        {
            return num < 10? ('0' + num): num;
        }
        //new Date return format: Fri Jul 27 2012 10:24:17 GMT+0800 (Malay Peninsula Standard Time)
        var today = new Date();
        return today.getDate() + '\/' + (today.getMonth() + 1) + '\/' + (today.getYear() + 1900)
            + ' ' + today.getHours() + ':' + pad2Digits(today.getMinutes()) + ':' + pad2Digits(today.getSeconds());
    };

    /**
     * Generate a formatted result string for ECI tracking.
     **/
    exports.formatResult = function(loc, sloc, cntErr) {
        return exports.getCurrentDate() + ', ' +
            loc + ', ' +
            sloc + ', 0, ' +
            cntErr;
    };

    /**
     * Generate the numbers for ECI tracking for current completed check.
     **/
    exports.getResult = function() {
        return exports.formatResult(exports.getLoc(), exports.getScannedLoc(), exports.getNumErrors());
    };

    /**
     * Print the numbers for ECI tracking of current completed run.
     **/
    exports.printResult = function() {
        console.log(exports.getResult());
    };

    /**
     * Save the numbers for ECI tracking of current completed run to 'jslint_reports/summary.csv'
     **/
    exports.saveResult = function() {
        var result = exports.getResult(),
            folder = 'jslint_reports',
            file = folder + '\/summary.csv';
        if (!fs.existsSync(folder))
        {
            fs.mkdirSync(folder);
            if (!fs.existsSync(folder)) //ensure folder is created
            {
                console.log('ERROR: JSLint failed to write summary to jslint_reports\/summary.csv');
                return;
            }
        }
        fs.writeFileSync(file, result, 'utf8');
    };

    /**
     * (Internal Use)
     * Generates HTML fragment for overriden JSLint options
     **/
    exports.getOptionsHtml = function() {
        if (exports.JSLINT.options === undefined)
        {
            return 'Options are All at default values.';
        }
        var i, str = '<b>Overriden options:</b><br>';
        //return JSON.stringify(exports.options);  //+= '<li>'
        for (i in exports.JSLINT.options)
        {
            //we want all the fields in prototype chain as well! so only filter out functions.
            if (typeof(exports.JSLINT.options[i]) !== 'function')
            {
                //str += '<li>' + i + ': ' + exports.options[i] + '</li>\n';
                if (typeof(exports.JSLINT.options[i]) === 'boolean')
                {
                    str += '<input type="checkbox" name="' + i + (exports.JSLINT.options[i]?'" checked><b>':'"><b>') + i + '</b></input>\n';
                }
                else if (i !== 'predef')
                {
                    str += '<li><b>' + i + '</b>: ' + exports.JSLINT.options[i] + '</li>\n';
                }
            }
        }
        if (exports.optionsOrg && exports.optionsOrg.predef)
        {
            str += '<li><b>predefined globals</b>: ' + exports.optionsOrg.predef + '\n';
        }
        return str;
    };

    //JSLint report HTML fragments
    exports.HTML_RPT_PREFIX =
        "<html>\n" +
        "<head>\n" +
        "<title>JSLint Report</title>\n" +
        "<style>\n" +
        "body {\n" +
        "    background-color: #EFEADF;\n" +
        "    margin: 0;\n" +
        "    padding: 0;\n" +
        "    font-family: sans-serif;\n" +
        "}\n" +
        "h1, h2, h3, a {\n" +
        "    font-family: sans-serif;\n" +
        "}\n" +
        "address {\n" +
        "    color: dimgray;\n" +
        "    display: block;\n" +
        "    float: right;\n" +
        "    font-family: arial;\n" +
        "    font-size: 90%;\n" +
        "    margin-left: 1em;\n" +
        "}\n" +
        "dl {\n" +
        "    background-color: #F3E8DB;\n" +
        "    font-family: monospace;\n" +
        "    margin-left: 1em;\n" +
        "    margin-right: 1em;\n" +
        "    margin-bottom: 0;\n" +
        "    padding-left: 1em;\n" +
        "    padding-right: 1em;\n" +
        "}\n" +
        "dt {\n" +
        "    display: block;\n" +
        "    font-family: arial;\n" +
        "    font-size: 80%;\n" +
        "    font-style: italic;\n" +
        "    margin-left: 3em;\n" +
        "}\n" +
        "dd {\n" +
        "    display: block;\n" +
        "    font-family: monospace;\n" +
        "    margin-left: 6em;\n" +
        "    overflow-x: hidden;\n" +
        "}\n" +
        "textarea {\n" +
        "    background-color: white;\n" +
        "    border: solid 1px #E7DECC;\n" +
        "    clear: both;\n" +
        "    font-family: monospace;\n" +
        "    margin: 2%;\n" +
        "    width: 95%;\n" +
        "    padding-left: 0.5em;\n" +
        "}\n" +
        "textarea[readonly] {\n" +
        "    background-color: #F3E8DB;\n" +
        "}\n" +
        "label {\n" +
        "    font-family: sans-serif;\n" +
        "    font-size: 90%;\n" +
        "    padding-left: 0.25em;\n" +
        "}\n" +
        "cite {\n" +
        "    background-color: #F3E8DB;\n" +
        "    display: block;\n" +
        "    font-family: arial,sans-serif;\n" +
        "    font-style: normal;\n" +
        "    font-weight:bold;\n" +
        "    margin-left: 1em;\n" +
        "    margin-right: 1em;\n" +
        "    overflow-x: hidden;\n" +
        "    padding-left: 1em;\n" +
        "    padding-right: 1em;\n" +
        "}\n" +
        "pre {\n" +
        "    margin-left: 1em;\n" +
        "    overflow: hidden;\n" +
        "}\n" +
        "dl address {\n" +
        "    display: inline;\n" +
        "    float: none;\n" +
        "    font-size: 80%;\n" +
        "    margin: 0;\n" +
        "}\n" +
        "</style>\n" +
        "</head>\n" +
        "<body>\n" +
        "<div id='main'>\n" +
        "<a href='#top' id='top'></a>";
    exports.HTML_RPT_POSTFIX =
        "<p>[ <a href='#top'>Top</a> ]" +
        "</div>\n" +
        "</body>\n" +
        "</html>";
    /**
     * (Internal use) Save JSLint check results for a file as a HTML report in 'jslint_reports' folder.
     * For a folder scan, proper folder tree is created.
     *
     * @param rootPath (string) path on which JSLInt is originally initiated
     * @param filePath (string) path to current file checked
     **/
    exports.saveHtmlResult = function(rootPath, filePath) {
        if (!fs.existsSync(filePath))
        {
            return;
        }
        var savePath = 'jslint_reports',
            subfolders, fullFilePath,
            i, cnt,
            data, rpt, rptErr, repProp, cntErr, loc, sloc, f;

        //1. Create report folder ('jslint_reports') if needed
        if (!fs.existsSync(savePath))
        {
            fs.mkdirSync(savePath);
            if (!fs.existsSync(savePath)) //ensure savePath is created
            {
                console.log('ERROR: JSLint failed to create "jslint_reports" savePath');
                return;
            }
        }
        //2. Check if is single file or folder
        rootPath = fs.realpathSync(rootPath);
        fullFilePath = filePath = fs.realpathSync(filePath);
        if (rootPath === filePath)
        {
            //1a. for single file, place report in same folder
            subfolders = filePath.split(path.sep);
            savePath += path.sep + subfolders[(subfolders.length > 1)? (subfolders.length - 1): 0] + '.html';
        }
        else
        {
            filePath = filePath.substring(rootPath.length + 1);
            subfolders = filePath.split(path.sep);
            
            //For multiple CLI paths scans, add another folder level using the root scanned folder name as well
            //  to separate the outputs.
            if (parsedOpts.jslintcheck && (parsedOpts.jslintcheck.length > 1) )
            {
                i = rootPath.split(path.sep);
                Array.prototype.splice.call(subfolders, 0, 0, i[i.length - 1]);
            }

            // Create folder structure if needed
            cnt = subfolders.length;
            if (cnt > 1)
            {
                for (i = 0; i < (cnt - 1); ++i)
                {
                    savePath += path.sep + subfolders[i];
                    if (!fs.existsSync(savePath))
                    {
                        fs.mkdirSync(savePath);
                        if (!fs.existsSync(savePath)) //ensure savePath is created
                        {
                            console.log('ERROR: JSLint failed to create savePath: ' + savePath);
                            return;
                        }
                    }
                }
                savePath += path.sep + subfolders[i] + '.html';
            }
            else
            {
                savePath += path.sep + subfolders[0] + '.html';
            }
        }

        //3. Generate & save report
        //console.log('Saving JSLint report to ' + savePath);
        data = exports.JSLINT.data();
        rpt = exports.JSLINT.report(data);
        rptErr = exports.JSLINT.error_report(exports.JSLINT.data());
        repProp = exports.JSLINT.properties_report(exports.JSLINT.property);
        cntErr = exports.getNumErrors();
        loc = exports.getLoc();
        sloc = exports.getScannedLoc();
        f = fs.openSync(savePath, 'w');
        if ( (f !== undefined) && (f !== null) )
        {
            fs.writeSync(f, exports.HTML_RPT_PREFIX);
            //Format the link to file correctly.
            //  Known issue: Safari does not like the links at all; while Firefox does not like UNC paths.
            if (fullFilePath.indexOf('\\\\') !== 0)
            {
                fullFilePath = 'file://' + fullFilePath;
            }
            fs.writeSync(f, ((cntErr > 0)? '<font color="red"><h1><a href="':'<font color="green"><h1><a href="')  + fullFilePath
                + '">' + filePath + '</a></h1>\n');
            fs.writeSync(f, '<h4>Test completed on: ' + new Date() + ' using JSLint version ' + JSLINT.edition + '</h4>\n');
            fs.writeSync(f, '<h3>Total no. of errors: ' + cntErr + '</h3></font>\n');
            fs.writeSync(f, '<h3>Total lines of codes: ' + loc + '</h3>\n');
            fs.writeSync(f, ((sloc < loc)? '<font color="red"><h3>Total scanned loc: ':
                '<font color="green"><h3>Total scanned loc: ') + sloc + '</h3></font>\n');
            if (data.json !== true)
            {
                //add quick links to function & properties reports
                fs.writeSync(f, '[ <a href="#fn_rpt">Functions</a> | <a href="#prop_rpt">Properties</a> ]\n');
            }
            if (cntErr > 0)
            {
                fs.writeSync(f, '<p><h2>Error Report</h2>\n');
                fs.writeSync(f, rptErr);
                fs.writeSync(f, '[ <a href="#top">Top</a> ]\n');
            }
            if (data.json !== true) //no function & properties reports for JSON
            {
                fs.writeSync(f, '<p><a href="#fn_rpt" id="fn_rpt"></a><h2>Function Report</h2>\n');
                fs.writeSync(f, rpt);
                fs.writeSync(f, '[ <a href="#top">Top</a> ]\n<p><a href="#prop_rpt" id="prop_rpt"></a><h2>Properties</h2>\n');
                fs.writeSync(f, repProp);
            }
            fs.writeSync(f, '<p>[ <a href="#top">Top</a> ]\n<p><a href="#options" id="options"></a><h2>Overriden JSLint Options</h2>\n');
            fs.writeSync(f, exports.getOptionsHtml());
            fs.writeSync(f, exports.HTML_RPT_POSTFIX);
        }
        else
        {
            console.log('ERROR: JSLint failed to create report: ' + savePath);
            return;
        }
    };

    /**
     * Generate a optionally coloured text version (non-HTML) of report on errors.
     *
     * @param useColors (boolean) whether to use colours in report (default: true)
     * @param hidePath (boolean) whether to hide file path in report (default: true)
     * @return (string) report generated
     **/
    exports.error_report = function (useColors, hidePath, filePath) {
        function collapse(data)
        {
            var i, lastFn = data[0]['function'], lastLine = data[0].line;
            for (i = 1; i < data.length; i += 1)
            {
                if ((data[i]['function'] === lastFn)
                    && (data[i].line === lastLine))
                {
                    data[i-1].name += ', ' + data[i].name;
                    data.splice(i, 1);
                    --i;
                }
                else
                {
                    lastFn = data[i]['function'];
                    lastLine = i;
                }
            }
            
        }
        var data = exports.JSLINT.data(), evidence, i, output = [], snippets, warning;
        if (useColors)
        {
            if (data.errors) {
                output.push('==Error(s)==\n'.bold.warn);
                for (i = 0; i < data.errors.length; i += 1) {
                    warning = data.errors[i];
                    if (warning) {
                        evidence = warning.evidence || '';
                        if (isFinite(warning.line)) {
                            if (!hidePath)
                            {
                                output.push(filePath + ' ');
                            }
                            output.push(('(line ' +
                                String(warning.line) +
                                ' character ' + String(warning.character) + ') ').bold.help);
                        }
                        output.push(warning.reason.bold.red + '\n');
                        if (evidence) {
                            output.push(evidence + '\n');
                        }
                    }
                }
            }
            if (data.unused || data['undefined']) {
                output.push('\n');
                if (data['undefined']) {
                    output.push('==Undefined== '.bold.warn + '(' + 'parameter '.bold.error + 'function '.bold.info + 'line#'.bold.help + ')\n');
                    snippets = [];  
                    for (i = 0; i < data['undefined'].length; i += 1) {
                        snippets[i] = data['undefined'][i].name.bold.error + ' ' +
                            data['undefined'][i]['function'].bold.info  + ' ' +
                            String(data['undefined'][i].line).bold.help;
                    }
                    output.push(snippets.join(', '));
                    output.push('\n\n');
                }
                if (data.unused) {
                    collapse(data.unused);
                    if (hidePath)
                    {
                        output.push('==Unused== '.bold.warn + '(' + 'function '.bold.info + 'line# '.bold.help + 'parameter(s)'.bold.error + ')\n');
                        snippets = [];
                        for (i = 0; i < data.unused.length; i += 1) {
                            snippets[i] =
                                data.unused[i]['function'].bold.info + ' ' +
                                String(data.unused[i].line).bold.help + ' ' +
                                data.unused[i].name.bold.error;
                        }
                        output.push(snippets.join(', '));
                    }
                    else
                    {
                        output.push('==Unused== '.bold.warn + '(' + 'function '.bold.info + 'parameter(s)'.bold.error + ')\n');
                        for (i = 0; i < data.unused.length; i += 1) {
                            output.push(filePath + ' ' +
                                ('(line ' + String(data.unused[i].line) + ' character 1) ').bold.help + '\n    ');
                            output.push(data.unused[i]['function'].bold.info + ' ' + 
                                data.unused[i].name.bold.error + '\n');
                        }
                    }
                    output.push('\n');
                }
            }
            if (data.json) {
                output.push('JSON: bad.'.bold.error);
            }
        }
        else //no colours
        {
            if (data.errors) {
                output.push('==Error(s)==\n');
                for (i = 0; i < data.errors.length; i += 1) {
                    warning = data.errors[i];
                    if (warning) {
                        evidence = warning.evidence || '';
                        if (!hidePath)
                        {
                            output.push(filePath + ' ');
                        }
                        if (isFinite(warning.line)) {
                            output.push('(line ' +
                                String(warning.line) +
                                ' character ' + String(warning.character) + ') ');
                        }
                        output.push(warning.reason + '\n');
                        if (evidence) {
                            output.push(evidence + '\n');
                        }
                    }
                }
            }
            if (data.unused || data['undefined']) {
                output.push('\n');
                if (data['undefined']) {
                    output.push('==Undefined== (parameter function line#)\n');
                    snippets = [];  
                    for (i = 0; i < data['undefined'].length; i += 1) {
                        snippets[i] = data['undefined'][i].name + ' ' +
                            data['undefined'][i]['function']  + ' ' +
                            String(data['undefined'][i].line);
                    }
                    output.push(snippets.join(', '));
                    output.push('\n\n');
                }
                if (data.unused) {
                    collapse(data.unused);
                    if (hidePath)
                    {
                        output.push("==Unused== ('function' line# parameter(s))\n");
                        snippets = [];
                        for (i = 0; i < data.unused.length; i += 1) {
                            snippets[i] =
                                data.unused[i]['function'] + ' ' +
                                String(data.unused[i].line) + ' ' +
                                data.unused[i].name;
                        }
                        output.push(snippets.join(', '));
                    }
                    else
                    {
                        output.push("==Unused== ('function' parameter(s))\n");
                        for (i = 0; i < data.unused.length; i += 1) {
                            output.push(filePath + ' ' +
                                '(line ' + String(data.unused[i].line) + ' character 1) \n    ');
                            output.push(data.unused[i]['function'] + ' ' +
                                data.unused[i].name + '\n');
                        }
                    }
                    output.push('\n');
                }
            }
            if (data.json) {
                output.push('JSON: bad.');
            }
        }
        return output.join('');
    };

    /**
     * Watch a file and JSLint check it once and whenever it's updated.
     * Will quit if file does not exist, or give an error if is a folder.
     *
     * @param filePath (string) path to file to be watched
     **/
    exports.watch = function(filePath)
    {
        /**
         * Prints the results from watch.
         * Colouring of report is enabled/disabled via commandline option of 'jslintcolor'.
         **/
        function printError()
        {
            //print beautified error list
            var cntErr = exports.getNumErrors(), rptErr, delimiter, dateTime = exports.getCurrentDateTime();
            if (!parsedOpts.jslintcolor)
            {
                delimiter = '====' + filePath + ' @ ' + dateTime + '====';
            }
            if (cntErr > 0)
            {
                if (parsedOpts.jslintcolor)
                {
                    delimiter = '====' + filePath.bold.error + ' @ ' + dateTime + '====';
                }
                console.log(delimiter);
                rptErr = exports.error_report(parsedOpts.jslintcolor !== false, parsedOpts.jslinthidepath !== false, filePath);
                console.log(rptErr);
                console.log(delimiter);
            }
            else
            {
                if (parsedOpts.jslintcolor)
                {
                    delimiter = '==== '+ filePath.bold.info + ' @ ' + dateTime + '====';
                }
                console.log(delimiter);
                console.log(parsedOpts.jslintcolor? '<No errors found>'.bold.info: '<No errors found>');
                console.log(delimiter);
            }
            console.log();
        }
        exports.watch.changed = {}; //modification active flag
        exports.watch.mtime = {};   //last file modification timestamp

        //1. Perform 1st JSLint check
        exports.watch.changed[filePath] = true;
        /*jslint unparam: true */ //Callback parameter could be used by other handlers
        exports.checkFileAsync(filePath, function(success, errors, filePath) {
            //clear flag when script file has been reloaded successfully, and wait for new changes
            delete exports.watch.changed[filePath];
            //print raw error list
            //console.log(util.inspect({'path': filePath, 'success': success, 'errors': errors}, true, 2, true));
            printError();
        });
        /*jslint unparam: false */
        //2. Watch file for changes
        fs.watch(filePath, { persistent: true }, function(event /*, filename*/) {
            //scriptModule access detected, check flag to avoid servicing the same scriptModule change multiple times (as fs.watch may be triggered several times)
            if (event === 'change' && !exports.watch.changed[filePath])
            {
                //check if script file is modified
                var newTime = fs.statSync(filePath).mtime.getTime();
                if (newTime !== exports.watch.mtime[filePath])
                {
                    exports.watch.mtime[filePath] = newTime;
                    exports.watch.changed[filePath] = true;
                    //delayed load to allow script file to be completely written 1st
                    setTimeout(function() {
                        //3. JSLint modified file
                        /*jslint unparam: true */
                        exports.checkFileAsync(filePath, function(success, errors, filePath) {
                            //clear flag when script file has been reloaded successfully, and wait for new changes
                            delete exports.watch.changed[filePath];
                            //print raw error list
                            //console.log(util.inspect({'path': filePath, 'success': success, 'errors': errors}, true, 2, true));
                            printError();
                        });
                        /*jslint unparam: false */
                    }, 1000);
                }
            }
        });
    };

    /**
     * Remove watch from a prior watched file.
     * @param filePath (string) path to file to be removed from watch
     **/
    exports.unwatch = function(filePath)
    {
        fs.unwatchFile(filePath);
    };

    /**
     * Execute any JSLint checks requested via CLI.
     * Terminates program when all checks are complete and
     * no watch is to be scheduled.
     **/
    exports.runCliChecks = function()
    {
        if (!parsedOpts.jslintcheck)
        {
            return;
        }
        var i, total = parsedOpts.jslintcheck.length, cnt = 0,
            loc = 0, sloc = 0, cntErr = 0, result;
        /*jslint unparam: true */ //errors is not used here, but other handlers may use it!
        function completionHandler(success, errors, filePath) {
            function saveResult(result)
            {
                var folder = 'jslint_reports',
                    file = folder + '\/all_summary.csv';
                if (!fs.existsSync(folder))
                {
                    fs.mkdirSync(folder);
                    if (!fs.existsSync(folder)) //ensure folder is created
                    {
                        console.log('ERROR: JSLint failed to write summary to jslint_reports\/summary.csv');
                        return;
                    }
                }
                fs.writeFileSync(file, result, 'utf8');
            }
            if (typeof success !== 'boolean')
            {
                //Check for completion (i.e. all given paths checked)
                ++cnt;
                if (cnt >= total)
                {
                    //All paths passed in via CLI checked
                    console.log('JSLint completed checking all paths provided via CLI:'.bold.info);
                    result = exports.formatResult(loc, sloc, cntErr);
                    console.log('Date, Total LOC, Scanned LOC, L1 Violations, L2 Violations');
                    console.log(result);
                    if (parsedOpts.jslintsummary)
                    {
                        saveResult(result);
                    }
                    if (!parsedOpts.jslintwatch)    //exit only if no watch to be scheduled
                    {
                        process.exit(0);
                    }
                }
            }
            else
            {
                //Accumulate results
                loc += exports.getLoc();
                sloc += exports.getScannedLoc();
                cntErr += exports.getNumErrors();

                console.log('JSLint completed checking: '.bold.info + filePath);
            }
        }
        /*jslint unparam: false */
        if (parsedOpts.jslintcheck !== undefined)
        {
            for (i = 0; i < total; ++i)
            {
                console.log('JSLint scheduled to check: ' + parsedOpts.jslintcheck[i]);
                exports.checkAsync(parsedOpts.jslintcheck[i], completionHandler);
            }
        }
    };

    /**
     * Process any JSLint options passed via CLI.
     **/
    exports.consolidateOptions = function() {
        var i, cnt;
        if (typeof(parsedOpts.jslintoption) === 'string')
        {
            try
            {
                cnt = fs.readFileSync(parsedOpts.jslintoption);
                i = JSON.parse(cnt);
                if (!!i && (typeof i === 'object'))
                {
                    exports.optionsOrg = i;
                    exports.options = JSON.parse(cnt); //clone JSON object
                }
                console.log('INFO: JSLint loaded options:\n' + util.inspect(i, true, 2, true));
            }
            catch (ex) {
                console.log('WARNING: JSLint failed to load options file: ' + parsedOpts.jslintoption);
            }
        }
        if (parsedOpts.jslintenable)
        {
            cnt = parsedOpts.jslintenable.length;
            for (i = 0; i < cnt; ++i)
            {
                exports.optionsOrg[parsedOpts.jslintenable[i]] = true;
                exports.options[parsedOpts.jslintenable[i]] = true;
            }
        }
        if (parsedOpts.jslintdisable)
        {
            cnt = parsedOpts.jslintdisable.length;
            for (i = 0; i < cnt; ++i)
            {
                exports.optionsOrg[parsedOpts.jslintdisable[i]] = false;
                exports.options[parsedOpts.jslintdisable[i]] = false;
            }
        }
        if (parsedOpts.jslintindent !== undefined)
        {
            i = parseInt(parsedOpts.jslintindent, 10);
            exports.optionsOrg.indent = i;
            exports.options.indent = i;
        }
        if (parsedOpts.jslintmaxerr !== undefined)
        {
            i = parseInt(parsedOpts.jslintmaxerr, 10);
            exports.optionsOrg.maxerr = i;
            exports.options.maxerr = i;
        }
        if (parsedOpts.jslintmaxlen !== undefined)
        {
            i = parseInt(parsedOpts.jslintmaxlen, 10);
            exports.optionsOrg.maxlen = i;
            exports.options.maxlen = i;
        }
        if (parsedOpts.jslintglobal)
        {
            exports.optionsOrg.predef = parsedOpts.jslintglobal;
            exports.options.predef = parsedOpts.jslintglobal;
        }
        if (parsedOpts.jslintcolor === undefined)
        {
            parsedOpts.jslintcolor = !!process.stdout.isTTY;
        }
    };

    //6. Consolidate JSLint options
    exports.consolidateOptions();
    console.log(parsedOpts.jslintcolor? 'JSLint-CLI: Using JSLint version'.bold.info:
        'JSLint-CLI: Using JSLint version', JSLINT.edition);
    //7. Execute JSLint checks if requested for (via CLI)
    exports.runCliChecks();
    //8. Execute JSLint watch if requested for (via CLI)
    if (parsedOpts.jslintwatch && fs.existsSync(parsedOpts.jslintwatch))
    {
        console.log('JSLint will be watching: ' + parsedOpts.jslintwatch);
        exports.watch(parsedOpts.jslintwatch);
    }
}
else
{
    console.log('ERROR: Failed to load JSLint.js');
    exports.JSLINT = dummy;
    exports.check = dummy;
    exports.checkFile = dummy;
    exports.checkAsync = dummy;
    exports.checkFileAsync = dummy;
    exports.getErrors = dummy;
    exports.createWsChannel = dummy;
    exports.sendReport = dummy;
}

return exports;
}('object' === typeof module ? module.exports : (this.JSLINT = {}), this));
