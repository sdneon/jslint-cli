jslint-cli
==========

jslint-cli is a [Node.JS](http://nodejs.org/) commandline interface wrapper for JSLint.
It provides these capabilities:
  - batch JSLint checking
  - HTML report & CSV static code analysis statistics generation
  - watch file for changes & perform JSLint check on modified file

JSLint checks JS, JS in HTML and JSON.
File extensions that will be checked are '.js', '.json', '.htm', '.html'.

## USAGE

    // At commandline:
    node node_modules\jslint-cli\jslint-cli [options] [files]
    
    Options available:
    --jslintoption <file>		Provide path to JSON file containing JSLint options (will be read 1st).
    --jslintenable <option>		Set given JSLint option to true. This option can be used multiple times.
    --jslintdisable	<option>	Set given JSLint option to false. This option can be used multiple times.
    --jslintindent <#>			Set JSLint option: indentation factor
    --jslintmaxerr <#>			Set JSLint option: maximum number of errors to allow (will stop checking if this number is reached)
    --jslintmaxlen <#>			Set JSLint option: maximum allowed length of a source line

    --jslintcheck <file>	Checks a file or entire folder's content. This option can be used multiple times.
    --jslinthtml			Generate HTML report of errors, functions and properties for each file in 'jslint_reports' folder.
    						For folders, folder structure will be recreated.
    --jslintsummary			Generate CSV report for entire folder in 'jslint_reports\summary.csv'.
    						If multiple check paths are given, generates an extra report in 'jslint_reports\all_summary.csv'
    						for the sum of all results.

    --jslintwatch			Watch a single file for changes & perform JSLint check on modified file.
    						No report will be saved to file; console printout only.
    --jslintcolor			Enable or disable use of colours in Watch results printout.
    						(Default: auto-detect support of colours and enable if supported).
    						For disabling colours in non-colour enabled consoles like Textpad's.
    --jslinthidepath			Whether to hide or print file path in watch printout.
    						(Default: hide file path in each error printout/true);
    						For jumping to error in source code file in Textpad
    						(use regex match: "\(.+\) (line \([0-9]+\) character \([0-9]+\)) ", File: 1, Line: 2, Column: 3).

## Examples

    E.g.Watch a file:
    node node_modules\jslint-cli\jslint-cli --jslintwatch node_modules\jslint-cli\jslint-cli.js

    E.g.Watch a file and print results without colours:
    node node_modules\jslint-cli\jslint-cli --no-jslintcolor --jslintwatch node_modules\jslint-cli\jslint-cli.js

    E.g.Check a few files and generate reports to 'jslint_reports' folder:
    node node_modules\jslint-cli\jslint-cli --jslinthtml --jslintcheck node_modules\jslint-cli\jslint-cli.js --jslintcheck test_codes.js

    E.g.Check a folder and generate reports to 'jslint_reports' folder:
    node node_modules\jslint-cli\jslint-cli --jslinthtml --jslintsummary --jslintcheck node_modules\jslint-cli

    E.g. Check a file using various JSLint options:
    node node_modules\jslint-cli\jslint-cli.js --jslintenable node --jslintenable nomen  --jslintenable sloppy
    	--jslintenable plusplus --jslintenable stupid --jslintenable white --jslintcheck node_modules\jslint-cli\jslint-cli.js

    E.g. Check a file using pre-defined JSLint options file, but disabling plusplus option:
    node node_modules\jslint-cli\jslint-cli.js --jslintoption options.json
    	--jslintdisable plusplus --jslintcheck node_modules\jslint-cli\jslint-cli.js
    Sample JSLint options JSON file:
	{
		"node": true,
		"nomen": true,
		"sloppy": true,
		"plusplus": true,
		"maxerr": 1000,
		"indent": 4,
		"stupid": true,
		"white": true,
		"predef": ["define"]
	}

    E.g. Setup in Textpad (JSLint output with contextual jump to errors):
    - Select menu 'Configure> Preferences...> Tools> Add> Program...', 'Apply' to confirm.
    - Edit the newly added program to fill in the path to JSLint-CLI.bat.
      - Set the 'Parameters' to '--jslinthidepath=false --jslintwatch $File' (without the quotes).
      - Set the 'Initial folder' to JSLint-CLI.bat/Node.JS folder.
      - Set 'Regular Expression to match output' to
        "\(.+\) (line \([0-9]+\) character \([0-9]+\)) " (without quotes).
      - Set 'Registers' as follows:
        File: 1, Line: 2, Column: 3

    E.g. Setup in Eclipse (no contextual jump; JSLint output in Console only):
    - Select menu 'Run> External Tools> External Tools Configuration',
      double-click 'Program' to create new external tool configuration.
    - Fill in JSLint-CLI details.
    - Set arguments to '--jslinthidepath=false --jslintwatch ${file_prompt}' (without the quotes).
    This will trigger a file-open prompt with the tool is activated.
    If you're using a project, may try ${resouce_loc} instead to run on the active file.

## Updating JSLint

    JSLint can be updated with the latest version by simply replacing the jslint.js file.
    Obtain new release of JSLint from http://github.com/douglascrockford/JSLint/

## Changelog

	V1.1.5 - 5 Aug 2013
		- Added <undef> JSLint option to ignore typedef comparison to 'undefined'.
		  E.g. needed for detecting browser platform (without incurring an undeclared 'window' variable error):
		  	typeof window === 'undefined'
		- Using JSLint dated 2013-07-31.
	V1.1.4 - 19 Apr 2013
		- Watch result printout of unused parameters can now show file path for 'contextual jump to error',
		  and unused parameters of the same function are consolidated.
		- Using JSLint dated 2013-04-09.
	V1.1.2 - 11 Oct 2012
		- Watch result no longer encodes HTML special characters in source text.
		- Added printout of JSLint version used for information.
		- Using JSLint dated 2012-10-03.
	V1.1.1 - 5 Oct 2012
		- Options can now be loaded from JSON file using 'jslintoption <options_file>'.
		- Fixed: HTML report now correctly lists all boolean options.
	V1.1.0 - 10 Sep 2012
		- Option to show file path in watch result printout for jumping to error in source code file.
	V1.0.9 - 23 Aug 2012
		- Auto-detect and select colour mode for watch result printout.
	V1.0.8 - 22 Aug 2012
		- 'Watch' now prints legible error list instead of JSLint's internal JSON representation.
		- Using JSLint dated 2012-08-11.
	V1.0.7 - 13 Aug 2012
		- Add unused parameters into total error count.
		- Add test completion time & unused parameters to report.
	V1.0.6 - 1 Aug 2012
		Added: able to specify JSLint options via CLI
	V1.0.0 - 27 Jul 2012
		Initial usable release; using JSLint dated 2012-07-24.
