var log = require('./Log.js').Logger('libZotero:RequestConfig');
var Validator = require('./Validator.js');

var RequestConfig = function(){
	this.config = {};
};

RequestConfig.prototype.Target = function(val){
	this.config['target'] = val;
	return this;
};

RequestConfig.prototype.TargetModifier = function(val){
	this.config['targetModifier'] = val;
	return this;
};

RequestConfig.prototype.LibraryType = function(val){
	this.config['libraryType'] = val;
	return this;
};

RequestConfig.prototype.LibraryID = function(val){
	this.config['libraryID'] = val;
	return this;
};

RequestConfig.prototype.ItemType = function(val){
	this.config['itemType'] = val;
	return this;
};

RequestConfig.prototype.ItemKey = function(val){
	this.config['itemKey'] = val;
	return this;
};

RequestConfig.prototype.CollectionKey = function(val){
	this.config['collectionKey'] = val;
	return this;
};

RequestConfig.prototype.Sort = function(val){
	this.config['sort'] = val;
	return this;
};

RequestConfig.prototype.Order = function(val){
	this.config['order'] = val;
	return this;
};

RequestConfig.prototype.Start = function(val){
	this.config['start'] = val;
	return this;
};

RequestConfig.prototype.Limit = function(val){
	this.config['limit'] = val;
	return this;
};

RequestConfig.prototype.Content = function(val){
	this.config['content'] = val;
	return this;
};

RequestConfig.prototype.Include = function(val){
	this.config['include'] = val;
	return this;
};

RequestConfig.prototype.Format = function(val){
	this.config['format'] = val;
	return this;
};

RequestConfig.prototype.Q = function(val){
	this.config['q'] = val;
	return this;
};

RequestConfig.prototype.Fq = function(val){
	this.config['fq'] = val;
	return this;
};

RequestConfig.prototype.Tag = function(val){
	this.config['tag'] = val;
	return this;
};

RequestConfig.prototype.TagType = function(val){
	this.config['tagType'] = val;
	return this;
};

RequestConfig.prototype.Key = function(val){
	this.config['key'] = val;
	return this;
};

RequestConfig.prototype.Style = function(val){
	this.config['style'] = val;
	return this;
};

RequestConfig.prototype.LinkWrap = function(val){
	this.config['linkwrap'] = val;
	return this;
};

RequestConfig.prototype.Validate = function(){
	let params = this.config;
	let valid = true;

	Object.keys(params).forEach(function(key){
		var val = params[key];
		//validate params based on patterns in Zotero.Validator
		if(Validator.validate(val, key) === false){
			//warn on invalid parameter and drop from params that will be used
			log.warn('API argument failed validation: ' + key + ' cannot be ' + val);
			delete params[key];
			valid = false;
		}
	});

	return valid;
};


module.exports = RequestConfig;
