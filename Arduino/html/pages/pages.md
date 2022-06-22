# Custom Events
`eg-setup`
Fired when the page is finished loading

`eg-config-load` 
Fired when we should load everything from the config, and display it in HTML elements

`eg-config-save` 
Fired when we are saving the config. Here we can set custom values to be saved as json

# Pages
Each page has a `index.html` and a `script.js`
Make sure to change the gulp file to include any new pages, as well as the `_header.html`.

Each page can listen to events. Any variables declared globally should be prefixed with the name of the folder. For example:
```js
var admin_someVariableName = 0
```

Same for function:
```js
function admin_someFunctionName() {

}
```

this will save us a lot of debugging pain later.

# Built in utility functions

## inputOnlyNumbersCheck(this)
Can be used to make sure the user only inputs a number
```html
<div class="col-sm-10"><input type="text" class="form-control" id="outputTCRSeconds"
                        oninput="inputOnlyNumbersCheck(this)" inputmode="numeric">
```

## parseIntOrDefault(int, defaultVal)
Tries to parse input as a int. If it fails or is null/undefined, default to the number provided
```js
parseIntOrDefault($('#outputTCRMinutes').val(), 0)
```

## parseStringOrDefault(int, defaultVal)
If the input is null or undefined, use the default value. Else, use the inputted value. Is this useless, probs so.
```js
parseStringOrDefault($('#camera').val(), "none")
```

## sendGETRequest(url, onSuccessCallback, onErrorCallback)
```js
sendPostRequest('status',

		//success
		(responseText) => {
			//process status text
		},

		//fail
		(statusCode, statusMessage, responseText) => {
			toastr.error('Failed to get status the board: ' + responseText + ' Error code: ' + statusCode + ' - ' + statusMessage, 'Error');
		});
```

## sendPostRequest(url, data, onSuccessCallback, onErrorCallback)
```js
sendPostRequest('/test/trigger',
        //Not sending data
		null,

		//success
		(responseText) => {
			toastr.success('Successfully triggered the board', 'Success');
		},

		//fail
		(statusCode, statusMessage, responseText) => {
			toastr.error('Failed to trigger the board: ' + responseText + ' Error code: ' + statusCode + ' - ' + statusMessage, 'Error');
		});
```