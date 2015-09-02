;(function(){
	if(window.GB645_1997)
	{
		throw "Had GB645_1997";
	}

	function encrypt(data, offset, len)
	{
		if(typeof(offset) === "undefined")
		{
			offset = 0;
		}

		if(typeof(len) === "undefined")
		{
			len = data.length - offset;
		}

		var _nEnd = offset + len;
		if(_nEnd > data.length)
		{
			return;
		}

		for(var i=offset; i<_nEnd; i++)
		{
			data[i] = (data[i] + 0x33)&0xFF;
		}
	}

	function decrypt(data, offset, len)
	{
		for(var i=offset; i<_nEnd; i++)
		{
			data[i] = (data[i]-0x33)&0xFF;
		}
	}

	/************************************************************
	* @description 构建一个GB645_1997对象
	* @param {Object} opts : 
	*						meterNumber{Number} 表号
	*						ctrlCode{Number} 控制码
	*					    dataLen{Number} 数据区长度，数据区包含数据标识
	*************************************************************/	
	var _gb645_1997 = function(opts)
	{
		this.options = {};
		this.options.meterNumber = new Uint8Array(6);
		utils.fillUint8Array(this.options.meterNumber, 0x99);
		this.options.encryptFunction = encrypt;
		this.options.decryptFunction = decrypt;

		if(opts)
		{
			if(opts.hasOwnProperty("meterNumber"))
			{
				this.setMeterNumber(opts.meterNumber);
			}

			if(opts.hasOwnProperty("ctrlCode"))
			{
				this.setCtrlCode(opts.ctrlCode);
			}

			if(opts.hasOwnProperty("dataLen"))
			{
				this.setDataLen(opts.dataLen);
			}
		}
	}

	/************************************************************
	* @description 设置表号
	* @param {Number或String} meterNumber 999999999999为广播地址
	*************************************************************/	
	_gb645_1997.prototype.setMeterNumber = function(meterNumber)
	{
		if(typeof(meterNumber) === "number")
		{
			meterNumber = meterNumber.toString(16);
		}else if(typeof(meterNumber) !== "string")
		{
			throw "the meterNumber must be string or number type.";
		}

		if(meterNumber.length > 12)
		{
			meterNumber = meterNumber.substr(meterNumber.length-12, 12);
		}

		var meterNumberArray = utils.bcdStrToUint8Array(meterNumber, 6);

		utils.uint8ArrayCopy(this.options.meterNumber, meterNumberArray, 0, 0, 6);
	}

	/************************************************************
	* @description 获取表号
	* @returns {String} 表号
	*************************************************************/
	_gb645_1997.prototype.getMeterNumber = function()
	{
		var _nResult = 0;
		var _nFactor = 1;
		for(var i=0; i<6; i++)
		{
			_nResult += this.options.meterNumber[i] * _nFactor;
			_nFactor *= 256;
		}

		return _nResult.toString(16);
	}

	/************************************************************
	* @description 设置控制码
	* @param {Number} ctrlCode控制码
	*************************************************************/	
	_gb645_1997.prototype.setCtrlCode = function(ctrlCode)
	{
		this.options.ctrlCode = ctrlCode;
	}

	/************************************************************
	* @description 获取控制码
	* @returns {Number} 控制码
	*************************************************************/
	_gb645_1997.prototype.getCtrlCode = function()
	{
		return this.options.ctrlCode;
	}

	/************************************************************
	* @description 设置数据区长度
	* @param {Number} len 数据区长度
	*************************************************************/	
	_gb645_1997.prototype.setDataLen = function(len)
	{
		if(isNaN(len))
		{
			throw "The meter number must be digital.";
		}
		if((len > 200)
			|| (len<=0))
		{
			throw "The len must less than or equal 200";
		}
		this.options.data = new Uint8Array(len);
	}

	/************************************************************
	* @description 获数据区长度
	* @returns {Number} 数据区长度
	*************************************************************/
	_gb645_1997.prototype.getDataLen = function()
	{
		if(typeof(this.options.data) === "undefined")
		{
			return 0;
		}
		return this.options.data.length;
	}

	/************************************************************
	* @description 设置数据区的数据内容，
	*			   把data中从dstOffset开始的len个数据写入到数据区dstOffset开始的位置。
	*			   data数组中的值不作任何改变。
	* @param {Uint8Array} data 数据内容
	* @param {Number} dstOffset 相对于数据区的偏移
	* @param {Number} srcOffset 数据内容的偏移
	* @param {Number} len 数据长度
	*************************************************************/
	_gb645_1997.prototype.setRawData = function(data, dstOffset, srcOffset, len)
	{
		if(!(data instanceof Uint8Array))
		{
			throw "the data must be Uint8Array type.";
		}

		if(typeof(this.options.data) === "undefined")
		{
			throw "you must setDataLen before.";
		}

		if(typeof(srcOffset) === "undefined")
		{
			srcOffset = 0;
		}

		if(srcOffset >= data.length)
		{
			throw "the srcOffset must be less than the data's length.";
		}

		if(typeof(dstOffset) === "undefined")
		{
			dstOffset = 0;
		}

		if(dstOffset >= this.options.data.length)
		{
			throw "the dstOffset must be less than the data len you set before.";
		}

		if(typeof(len) === "undefined")
		{
			len = data.length - srcOffset;
		}

		if((len+srcOffset) > data.length)
		{
			len = data.length - srcOffset;
		}

		if((len + dstOffset) > this.options.data.length)
		{
			len = this.options.data.length - dstOffset;
		}

		utils.uint8ArrayCopy(this.options.data, data, srcOffset, dstOffset, len);
	}

	/************************************************************
	* @description 设置数据区的数据内容，
	*			   把value经过BCD转化后写入到数据区offset开始的位置。
	* @param {Number} value 数据值
	* @param {Number} offset 相对于数据区的偏移
	* @param {Number} len 数据长度
	* @param {Boolean} littleEndian 是否为小端模式
	*************************************************************/
	_gb645_1997.prototype.setDataByUint = function(value, offset, len, littleEndian)
	{
		if(typeof(offset) === "undefined")
		{
			offset = 0;
		}

		if(typeof(len) === "undefined")
		{
			len = 2;
		}

		if(typeof(littleEndian) === "undefined")
		{
			littleEndian = true;
		}

		var _nEnd = offset + len;
		if(_nEnd > this.options.data.length)
		{
			throw "the data len must less than or equal the len you set before.";
		}
		_nEnd --;
		for(var i=0; i<len; i++)
		{
			var _tmpValue = value%10;
			value = parseInt(value/10);
			_tmpValue += (value%10)*16;
			value = parseInt(value/10);

			if(littleEndian)
			{
				data[offset+i] = _tmpValue;
			}else
			{
				data[_nEnd-i] = _tmpValue;
			}
			if(value <= 0)
			{
				break;
			}
		}
	}

	/************************************************************
	* @description 返回数据区中的原始内容。
	* @param {Number} dstOffset 相对于数据区的偏移
	* @param {Number} len 数据长度
	* @returns {Uint8Array} 数据内容
	*************************************************************/
	_gb645_1997.prototype.getRawData = function(offset, len)
	{
		if((typeof(this.options.data) === "undefined")
			|| !(this.options.data instanceof Uint8Array))
		{
			throw "the data is null.";
		}

		if(typeof(offset) === "undefined")
		{
			offset = 0;
		}

		if((typeof(len) === "undefined")
			|| ((offset + len) > this.options.data.length))
		{
			len = this.options.data.length - offset;
		}

		return new Uint8Array(this.options.data.buffer, offset, len);
	}

	/************************************************************
	* @description 返回数据区中的经过BCD转化后的内容。
	* @param {Number} dstOffset 相对于数据区的偏移
	* @param {Number} len 数据长度
	* @param {Boolean} littleEndian 是否为小端模式
	* @returns {Number} 数据内容
	*************************************************************/
	_gb645_1997.prototype.getDataForUint = function(offset, len, littleEndian)
	{
		if(typeof(offset) === "undefined")
		{
			offset = 0;
		}

		if(typeof(len) === "undefined")
		{
			len = 2;
		}

		if(typeof(littleEndian) === "undefined")
		{
			littleEndian = true;
		}

		var _nEnd = offset + len;
		if(_nEnd > this.options.data.length)
		{
			throw "the data you need is out of the range.";
		}

		_nEnd --;
		var _nResult = 0;
		for(var i=0; i<len; i++)
		{
			var _nTmpData = 0;
			if(littleEndian)
			{
				_nTmpData = this.options.data[_nEnd-i];
			}else
			{
				_nTmpData = this.options.data[offset+i];
			}

			_nResult = _nResult*256 + _nTmpData;
		}

		return parseInt(_nResult.toString(16));
	}

	/************************************************************
	* @description 设置数据标识
	* @param {Number} di 数据标识
	*************************************************************/
	_gb645_1997.prototype.setDI = function(di)
	{
		if(typeof(this.options.dataLen) === "undefined")
		{
			this.setDataLen(2);
		}

		if(2>this.options.dataLen)
		{
			throw "the data len must less than or equal the len you set before.";
		}

		var dv = new DataView(this.options.data.buffer, 0);
		dv.setUint16(0, di, true);
	}

	/************************************************************
	* @description 获取数据标识
	* @returns {Number} 数据标识
	*************************************************************/
	_gb645_1997.prototype.getDI = function()
	{
		if(typeof(this.options.data) === "undefined")
		{
			throw "you must set data len before or parseCmd before.";
		}

		if(2>this.options.data.length)
		{
			throw "the data len is error.";
		}

		var dv = new DataView(this.options.data.buffer, 0);
		return dv.getUint16(0, true);
	}

	/************************************************************
	* @description 设置数据加密函数
	* @param {Fuction} fnEncrypt 加密函数，原型为function(data, offset, len)
	*					data{Uint8Array} 需要加密的数据数组,
	*					offset 偏移
	*					len 数据长度
	*************************************************************/
	_gb645_1997.prototype.setEncryptFunction = function(fnEncrypt)
	{
		this.options.encryptFunction = fnEncrypt;
	}

	/************************************************************
	* @description 设置数据解密函数
	* @param {Fuction} fnEncrypt 解密函数，原型为function(data, offset, len)
	*					data{Uint8Array} 需要解密的数据数组,
	*					offset 偏移
	*					len 数据长度
	*************************************************************/
	_gb645_1997.prototype.setDecryptFunction = function(fnDecrypt)
	{
		this.options.decryptFunction = fnDecrypt;
	}

	/************************************************************
	* @description 返回报文，在设置完GB645_1997的各参数之后，
	*			   调用函数返回GB645_1997报文。
	* @returns {Object} result: 
	*						 result{Uint8Array} 报文数据，如果失败则为null
	*						 success{Bool} 是否设置成功
	*						 msg{String} 错误信息提示
	*************************************************************/
	_gb645_1997.prototype.getCmd = function()
	{
		var _returnObj = {};
		_returnObj["result"] = null;
		_returnObj["success"] = false;
		var _cmdLen= 12;
		var _dataLen = 0;

		if(typeof(this.options.data) !== "undefined")
		{
			_cmdLen += this.options.data.length;
			_dataLen += this.options.data.length;
		}

		if(typeof(this.options.ctrlCode) === "undefined")
		{
			this.options.ctrlCode = 0x01;
		}

		var _result = new Uint8Array(_cmdLen);
		var _dataview = new DataView(_result.buffer, 0);
		_dataview.setUint8(0, 0x68);
		utils.uint8ArrayCopy(_result, this.options.meterNumber, 1, 0, 6);
		_dataview.setUint8(7, 0x68);
		_dataview.setUint8(8, this.options.ctrlCode);
		_dataview.setUint8(9, _dataLen);

		if((typeof(this.options.data) !== "undefined")
			&& (this.options.data.length > 0))
		{
			utils.uint8ArrayCopy(_result, this.options.data, 10, 0, this.options.data.length);
		}

		this.options.encryptFunction(_result, 10, _dataLen);

		var nCRC8 = utils.getCRC8(_result, 0, _cmdLen-2);
		_dataview.setUint8(_cmdLen-2, nCRC8);
		_dataview.setUint8(_cmdLen-1, 0x16);

		_returnObj.result = _result;
		_returnObj.success = true;
		_returnObj.msg = "success";
		return _returnObj;
	}

	/************************************************************
	* @description 解析报文
	* @param {Uint8Array} data 需要解析的报文
	* @param {Number} offset 需要解析的报文的起始地址
	* @param {Number} len 需要解析的报文长度
	* @returns {Object} result: 
	*						 completed{Bool} 是否解析完成，
	*										 为true则解析到完整的报文，
	*										 为false则未解析到完整的报文；
	*						 success{Bool} 是否解析到成功的报文，
	*									   在completed为true, 该参数才有意义。
	*									   为true则为正确回应报文，为false为异常回应。
	*						 startIndex{Number} 解析到的报文相对于data的偏移
	*						 len{Number} 解析到的正确报文的长度
	*************************************************************/
	_gb645_1997.prototype.parseCmd = function(data, offset, len)
	{
		if(typeof(offset) === "undefined")
		{
			offset = 0;
		}

		if((typeof(len) === "undefined")
			|| ((offset+len)>data.length))
		{
			len = data.length - offset;
		}

		var _returnObj = {};
		var _nCurIndex = offset;
		var _nMaxIndex = offset + len - 12;
		while(_nCurIndex < _nMaxIndex)
		{
			if(0x68 !== data[_nCurIndex])
			{
				_nCurIndex++;
				continue;
			}

			if(0x68 !== data[_nCurIndex + 7])
			{
				_nCurIndex++;
				continue;
			}

			var _nTmpLen = data[_nCurIndex + 9];
			var _nTmpTotalLen = _nTmpLen + 12;
			if(0x16 != data[_nCurIndex + _nTmpTotalLen -1])
			{
				_nCurIndex++;
				continue;
			}

			var _nTmpCRC8 = utils.getCRC8(data, _nCurIndex, _nTmpTotalLen-2);
			if(_nTmpCRC8 !== data[_nCurIndex + _nTmpTotalLen - 2])
			{
				_nCurIndex++;
				continue;
			}

			this.options.ctrlCode = data[_nCurIndex + 8];
			utils.uint8ArrayCopy(this.options.meterNumber, data, 0, _nCurIndex+1, 6);
			if(_nTmpLen>0)
			{
				this.options.data = new Uint8Array(_nTmpLen);
				utils.uint8ArrayCopy(this.options.data, data, 0, _nCurIndex+10, _nTmpLen);
				this.options.decryptFunction(this.options.data);
			}

			_returnObj.startIndex = _nCurIndex;
			_returnObj.len = _nTmpTotalLen;
			_returnObj.completed = true;
			_returnObj.success = true;
			return _returnObj;
		}

		_returnObj.startIndex = 0;
		_returnObj.len = 0;
		_returnObj.completed = false;
		_returnObj.success = false;
		return _returnObj;
	}

	window.GB645_1997 = _gb645_1997;

})();