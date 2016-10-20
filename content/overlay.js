/**
 * Namespaces
 */
if (typeof(extensions) === 'undefined') extensions = {};
if (typeof(extensions.messyWhiteSpace) === 'undefined') extensions.messyWhiteSpace = {
	version: '1.0'
};

(function() {

	var notify = require("notify/notify"),
		self = this;
		
	window.removeEventListener('view_opened', self.testForWhiteSpace);
	
	this.testForWhiteSpace = function() {
		var currentView = ko.views.manager.currentView,
			koDoc = (currentView.koDoc === undefined ? currentView.document : currentView.koDoc);
		
		if (currentView === undefined) {
			return false;
		}
	
		if (koDoc === undefined) {
			return false;
		}
		
		var content = koDoc.buffer;
		if (content === null || content.length === 0) {
			return false;
		}
		
		var currEOL = self.test_eol(content),
			splitContent = content.split(currEOL),
			spaceOcc = 0;
		
		
		for (var i = 0; i < splitContent.length; i++) {
			if (/^[^\S\t]{2,4}/.test(splitContent[i])) { 
				spaceOcc++;
			}
		}
		
		if (spaceOcc > 0) {
			var features = "chrome,titlebar,toolbar,centerscreen,alwaysRaised,dialog=no",
				windowVars = {
				ko: ko,
				overlay: self,
				notify: notify,
			};
			window.openDialog('chrome://messyWhiteSpace/content/whiteSpaceDialog.xul', "messyWhiteSpace", features, windowVars);
		}
		
	}
	
	this.toggleViewWhiteSpace = function(){
		ko.commands.doCommand('cmd_viewWhitespace');
		return true;
	}
	
	this.fixIt = function(){
		var currentView = ko.views.manager.currentView,
			koDoc = (currentView.koDoc === undefined ? currentView.document : currentView.koDoc);
		
		if (currentView === undefined) {
			return false;
		}
	
		if (koDoc === undefined) {
			return false;
		}
		
		var content = koDoc.buffer;
		
		if (content === null || content.length === 0) {
			return false;
		}
		
		var currEOL = self.test_eol(content),
			splitContent = content.split(currEOL),
			result = '';
		
		for (var i = 0; i < splitContent.length; i++) {
			result = result + splitContent[i].replace(/([^\S\t\n]{4}|[^\S\t\n]{2})/g, '	') + currEOL;
		}
		
		koDoc.buffer = result;
		koDoc.tabWidth = 4;
		koDoc.useTabs = true;

	}
	
	this.safePaste = function() {
		var currentView = ko.views.manager.currentView,
			clipboard = require("sdk/clipboard"),
			koDoc = (currentView.koDoc === undefined ? currentView.document : currentView.koDoc);
		
		if (currentView === undefined) {
			ko.commands.doCommand('cmd_paste');
			return false;
		}
		
		if (koDoc === undefined) {
			ko.commands.doCommand('cmd_paste');
			return false;
		}
		
		if (self._in_array('html', clipboard.currentFlavors)) {
			try {
				var clipboardData = clipboard.get(),
					output = '',
					currEOL = self.test_eol(koDoc.buffer),
					clipBoardEol = self.test_eol(clipboardData),
					splitContent = clipboardData.split(clipBoardEol),
					scimoz = currentView.scimoz;
					
				
				if (scimoz === null) {
					ko.commands.doCommand('cmd_paste');
					return false;
				}
				
				if (scimoz.focus === false) {
					return false;
				}
				
				for (var i = 0; i < splitContent.length; i++) {
					output = output + splitContent[i].replace(/([^\S\t\n]{4}|[^\S\t\n]{2})/g, '	') + currEOL;
				}
				
				if (scimoz.selText.length > 0) {
					scimoz.replaceSel(output);
				} else {
					scimoz.insertText(scimoz.currentPos, output);
					scimoz.gotoPos((scimoz.currentPos + output.length));
				}
			} catch(e) {
				console.error(e.message);
				ko.commands.doCommand('cmd_paste');
			}
		} else {
			ko.commands.doCommand('cmd_paste');
		}
	
	}
	
	this.reopen_file = function(){
		var currentView = ko.views.manager.currentView,
			koDoc = (currentView.koDoc === undefined ? currentView.document : currentView.koDoc);
		
		if (currentView === undefined) {
			return false;
		}
		
		if (koDoc === undefined) {
			return false;
		}
		
		var file = koDoc.file;
		
		if (file === null) {
			return false;
		}
		
		var path = file.displayPath;
		
		self.fixIt();
		currentView.save();
		currentView.close();
		setTimeout(function(){
			ko.open.displayPath(path);
		}, 300);
	}
	
	this.test_eol = function(source) {
		var cleanSource = source.replace(/(\/\*[^\*]+\*\/|\/.[^\s]+\/)/g, ''); //remove reggex and comments
		if (/\r\n/.test(cleanSource)) {
			return '\r\n';
		} else if (/\r/.test(cleanSource) && /\n/.test(cleanSource) === false) {
			return '\r';
		} else if (/\n/.test(cleanSource) && /\r/.test(cleanSource) === false) {
			return '\n';
		}
		return '\n';
	};
	
	this._in_array = function(search, array) {
		for (i = 0; i < array.length; i++) {
			if (array[i] == search) {
				return true;
			}
		}
		return false;
	}
	
	window.addEventListener('view_opened', self.testForWhiteSpace);

}).apply(extensions.messyWhiteSpace);
