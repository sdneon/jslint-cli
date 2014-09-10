jslint-cli
==========

jslint-cli is a [Node.JS](http://nodejs.org/) commandline interface wrapper for [JSLint](https://github.com/douglascrockford/JSLint).
It provides these capabilities:
  - batch JSLint checking
  - HTML report & CSV static code analysis statistics generation
  - watch file for changes & perform JSLint check on modified file

[JSLint](https://github.com/douglascrockford/JSLint) checks JS, JS in HTML and JSON.
File extensions that will be checked are '.js', '.json', '.htm', '.html'.

Only tested in Windows.

## USAGE

At commandline:

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

### E.g. Setup in [Textpad](http://textpad.com/products/textpad/index.html) (JSLint output with contextual jump to errors):
* Select menu 'Configure> Preferences...> Tools> Add> Program...', 'Apply' to confirm.
* Edit the newly added program to fill in the path to JSLint-CLI.bat.
  * Set the 'Parameters' to

		'--jslinthidepath=false --jslintwatch $File' (without the quotes).

  * Set the 'Initial folder' to JSLint-CLI.bat/Node.JS folder.
  * Set 'Regular Expression to match output' to

        "\(.+\) (line \([0-9]+\) character \([0-9]+\)) " (without quotes).

  * Set 'Registers' as follows:
        File: 1, Line: 2, Column: 3

### E.g. Setup in Eclipse (no contextual jump; JSLint output in Console only):
* Select menu 'Run> External Tools> External Tools Configuration', double-click 'Program' to create new external tool configuration.
* Fill in JSLint-CLI details.
  * Set arguments to '--jslinthidepath=false --jslintwatch ${file_prompt}' (without the quotes).
  This will trigger a file-open prompt with the tool is activated.
  If you're using a project, may try ${resouce_loc} instead to run on the active file.

## Updating JSLint

JSLint can be updated with the latest version by simply replacing with the latest jslint.js file from (its repository)[http://github.com/douglascrockford/JSLint/].
