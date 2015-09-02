;(function(){
	if(window.utils)
	{
		return;
	}

	var _utils = {};

	/* Table of CRC values for high-order byte */
	var table_crc_hi = new Uint8Array([
	        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0,
	        0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
	        0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0,
	        0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
	        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1,
	        0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
	        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1,
	        0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
	        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0,
	        0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40,
	        0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1,
	        0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
	        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0,
	        0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40,
	        0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0,
	        0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
	        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0,
	        0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
	        0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0,
	        0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
	        0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0,
	        0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40,
	        0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1,
	        0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
	        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0,
	        0x80, 0x41, 0x00, 0xC1, 0x81, 0x40
	        ]);


	/* Table of CRC values for low-order byte */
	var table_crc_lo = new Uint8Array([
	        0x00, 0xC0, 0xC1, 0x01, 0xC3, 0x03, 0x02, 0xC2, 0xC6, 0x06,
	        0x07, 0xC7, 0x05, 0xC5, 0xC4, 0x04, 0xCC, 0x0C, 0x0D, 0xCD,
	        0x0F, 0xCF, 0xCE, 0x0E, 0x0A, 0xCA, 0xCB, 0x0B, 0xC9, 0x09,
	        0x08, 0xC8, 0xD8, 0x18, 0x19, 0xD9, 0x1B, 0xDB, 0xDA, 0x1A,
	        0x1E, 0xDE, 0xDF, 0x1F, 0xDD, 0x1D, 0x1C, 0xDC, 0x14, 0xD4,
	        0xD5, 0x15, 0xD7, 0x17, 0x16, 0xD6, 0xD2, 0x12, 0x13, 0xD3,
	        0x11, 0xD1, 0xD0, 0x10, 0xF0, 0x30, 0x31, 0xF1, 0x33, 0xF3,
	        0xF2, 0x32, 0x36, 0xF6, 0xF7, 0x37, 0xF5, 0x35, 0x34, 0xF4,
	        0x3C, 0xFC, 0xFD, 0x3D, 0xFF, 0x3F, 0x3E, 0xFE, 0xFA, 0x3A,
	        0x3B, 0xFB, 0x39, 0xF9, 0xF8, 0x38, 0x28, 0xE8, 0xE9, 0x29,
	        0xEB, 0x2B, 0x2A, 0xEA, 0xEE, 0x2E, 0x2F, 0xEF, 0x2D, 0xED,
	        0xEC, 0x2C, 0xE4, 0x24, 0x25, 0xE5, 0x27, 0xE7, 0xE6, 0x26,
	        0x22, 0xE2, 0xE3, 0x23, 0xE1, 0x21, 0x20, 0xE0, 0xA0, 0x60,
	        0x61, 0xA1, 0x63, 0xA3, 0xA2, 0x62, 0x66, 0xA6, 0xA7, 0x67,
	        0xA5, 0x65, 0x64, 0xA4, 0x6C, 0xAC, 0xAD, 0x6D, 0xAF, 0x6F,
	        0x6E, 0xAE, 0xAA, 0x6A, 0x6B, 0xAB, 0x69, 0xA9, 0xA8, 0x68,
	        0x78, 0xB8, 0xB9, 0x79, 0xBB, 0x7B, 0x7A, 0xBA, 0xBE, 0x7E,
	        0x7F, 0xBF, 0x7D, 0xBD, 0xBC, 0x7C, 0xB4, 0x74, 0x75, 0xB5,
	        0x77, 0xB7, 0xB6, 0x76, 0x72, 0xB2, 0xB3, 0x73, 0xB1, 0x71,
	        0x70, 0xB0, 0x50, 0x90, 0x91, 0x51, 0x93, 0x53, 0x52, 0x92,
	        0x96, 0x56, 0x57, 0x97, 0x55, 0x95, 0x94, 0x54, 0x9C, 0x5C,
	        0x5D, 0x9D, 0x5F, 0x9F, 0x9E, 0x5E, 0x5A, 0x9A, 0x9B, 0x5B,
	        0x99, 0x59, 0x58, 0x98, 0x88, 0x48, 0x49, 0x89, 0x4B, 0x8B,
	        0x8A, 0x4A, 0x4E, 0x8E, 0x8F, 0x4F, 0x8D, 0x4D, 0x4C, 0x8C,
	        0x44, 0x84, 0x85, 0x45, 0x87, 0x47, 0x46, 0x86, 0x82, 0x42,
	        0x43, 0x83, 0x41, 0x81, 0x80, 0x40
	        ]);

	/***********************************
	* @description 计算CRC8，从data的offset位置开始计算len个数据
	* @param {Uint8Array} data 计算的源数组
	* @param {Number} offset 计算的起始位置，默认为0
	* @param {Number} len 计算的长度
	* @returns {Number} 返回计算得到的uint8的交验值
	************************************/
	_utils.getCRC8 = function(data, offset, len)
	{
		if(!(data instanceof Uint8Array))
		{
			throw "param must Uint8Array type";
		}

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
			throw "the len is large than the data's length";
		}

		var sum = 0;
		for (var i = offset; i < _nEnd; i++) {
			sum += data[i];
		};

		return (sum%256);
	}

	/***********************************
	* @description 计算CRC16，从data的offset位置开始计算len个数据
	* @param {Uint8Array} data 计算的源数组
	* @param {Number} offset 计算的起始位置，默认为0
	* @param {Number} len 计算的长度
	* @returns {Number} 返回计算得到的uint16的交验值
	************************************/
	_utils.getCRC16 = function(data, offset, len)
	{
		if(!(data instanceof Uint8Array))
		{
			throw "param must Uint8Array type";
		}

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
			throw "the len is large than the data's length";
		}

		var crcHigh = 0xff;
		var crcLow  = 0xff;
		var tmpIndex = 0;

		for(var i=offset; i<_nEnd; i++)
		{
			tmpIndex = crcHigh ^ data[i];
			crcHigh = crcLow ^ table_crc_hi[tmpIndex];
			crcLow	= table_crc_lo[tmpIndex];
		}

		return (crcHigh<<8 | crcLow);
	}

	/***********************************
	* @description 把Uint8Array转化为Uint16数据
	* @param {Uint8Array} data 需要转化的Uint8Array数组
	* @param {Number} offset 起始位置，默认为0
	* @param {Bool} littleEndian 小端模式，默认为true
	* @returns {Number} 返回Uint16值
	************************************/
	_utils.uint8ArrayToUint16 = function(data, offset, littleEndian)
	{
		if(!(data instanceof Uint8Array))
		{
			throw "The rawData must be Uint8Array type."
		}

		if(typeof(offset) === "undefined")
		{
			offset = 0;
		}
		var view = new DataView(data.buffer, 0);
		return view.getUint16(offset, littleEndian);
	}

	/***********************************
	* @description 把Uint8Array转化为Int16数据
	* @param {Uint8Array} data 需要转化的Uint8Array数组
	* @param {Number} offset 起始位置，默认为0
	* @param {Bool} littleEndian 小端模式，默认为true
	* @returns {Number} 返回Int16值
	************************************/
	_utils.uint8ArrayToInt16 = function(data, offset, littleEndian)
	{
		if(!(data instanceof Uint8Array))
		{
			throw "The rawData must be Uint8Array type."
		}
		if(typeof(offset)=== "undefined")
		{
			offset = 0;
		}
		var view = new DataView(data.buffer, 0);
		return view.getInt16(offset, littleEndian);
	}

	/***********************************
	* @description 把Uint8Array转化为Uint32数据
	* @param {Uint8Array} data 需要转化的Uint8Array数组
	* @param {Number} offset 起始位置，默认为0
	* @param {Bool} littleEndian 小端模式，默认为true
	* @returns {Number} 返回Uint32值
	************************************/
	_utils.uint8ArrayToUint32 = function(data, offset, littleEndian)
	{
		if(!(data instanceof Uint8Array))
		{
			throw "The rawData must be Uint8Array type."
		}
		if(typeof(offset) === "undefined")
		{
			offset = 0;
		}
		var view = new DataView(data.buffer, 0);
		return view.getUint32(offset, littleEndian);
	}

	/***********************************
	* @description 把Uint8Array转化为Int32数据
	* @param {Uint8Array} data 需要转化的Uint8Array数组
	* @param {Number} offset 起始位置，默认为0，
	* @param {Bool} littleEndian 小端模式，默认为true
	* @returns {Number} 返回Int32值
	************************************/
	_utils.uint8ArrayToInt32 = function(data, offset, littleEndian)
	{
		if(!(data instanceof Uint8Array))
		{
			throw "The rawData must be Uint8Array type."
		}
		if(typeof(offset) === "undefined")
		{
			offset = 0;
		}
		var view = new DataView(data.buffer, 0);
		return view.getInt32(offset, littleEndian);
	}

	/***********************************
	* @description 把Uint8Array转化为Float数据
	* @param {Uint8Array} data 需要转化的Uint8Array数组
	* @param {Number} offset 起始位置，默认为0，
	* @param {Bool} littleEndian 小端模式，默认为true
	* @returns {Number} 返回Float值
	************************************/
	_utils.uint8ArrayToFloat = function(data, offset, littleEndian)
	{
		if(!(data instanceof Uint8Array))
		{
			throw "The rawData must be Uint8Array type."
		}
		if(typeof(offset) === "undefined")
		{
			offset = 0;
		}
		var view = new DataView(data.buffer, 0);
		return view.getFloat32(offset, littleEndian);
	}

	/***********************************
	* @description 把Uint16转化为Uint8Array数组
	* @param {Number} data 需要转化的Uint16数据
	* @param {Bool} littleEndian 小端模式，默认为true
	* @returns {Uint8Array} 返回Uint8Array数组
	************************************/
	_utils.uint16ToUint8Array = function(data, littleEndian)
	{
		if(isNaN(data))
		{
			throw "The data must be number.";
		}
		if((data<0)
			||(data>0xFFFF))
		{
			throw "The data must between 0~65535.";
		}
		var result = new Uint8Array(2);
		var view = new DataView(result.buffer, 0);
		view.setUint16(0, data, littleEndian);
		return result;
	}

	/***********************************
	* @description 把Int16转化为Uint8Array数组
	* @param {Number} data 需要转化的Int16数据
	* @param {Bool} littleEndian 小端模式，默认为true
	* @returns {Uint8Array} 返回Uint8Array数组
	************************************/
	_utils.int16ToUint8Array = function(data, littleEndian)
	{
		if(isNaN(data))
		{
			throw "The data must be number.";
		}
		if((data<-32768)
			||(data>32767))
		{
			throw "The data must between -32768~32767.";
		}
		var result = new Uint8Array(2);
		var view = new DataView(result.buffer, 0);
		view.setInt16(0, data, littleEndian);
		return result;
	}

	/***********************************
	* @description 把Uint32转化为Uint8Array数组
	* @param {Number} data 需要转化的Uint32数据
	* @param {Bool} littleEndian 小端模式，默认为true
	* @returns {Uint8Array} 返回Uint8Array数组
	************************************/
	_utils.uint32ToUint8Array = function(data, littleEndian)
	{
		if(isNaN(data))
		{
			throw "The data must be number.";
		}
		if((data<0)
			||(data>4294967295))
		{
			throw "The data must between 0~4294967295.";
		}
		var result = new Uint8Array(4);
		var view = new DataView(result.buffer, 0);
		view.setUint32(0, data, littleEndian);
		return result;
	}

	/***********************************
	* @description 把Int32转化为Uint8Array数组
	* @param {Number} data 需要转化的Int32数据
	* @param {Bool} littleEndian 小端模式，默认为true
	* @returns {Uint8Array} 返回Uint8Array数组
	************************************/
	_utils.int32ToUint8Array = function(data, littleEndian)
	{
		if(isNaN(data))
		{
			throw "The data must be number.";
		}

		if((data<-2147483648)
			||(data>2147483647))
		{
			throw "The data must between 2147483648~2147483647.";
		}
		var result = new Uint8Array(4);
		var view = new DataView(result.buffer, 0);
		view.setInt32(0, data, littleEndian);
		return result;
	}

	/***********************************
	* @description 把Float转化为Uint8Array数组
	* @param {Number} data 需要转化的Float数据
	* @param {Bool} littleEndian 小端模式，默认为true
	* @returns {Uint8Array} 返回Uint8Array数组
	************************************/
	_utils.floatToUint8Array = function(data, littleEndian)
	{
		if(isNaN(data))
		{
			throw "The data must be number.";
		}

		var result = new Uint8Array(4);
		var view = new DataView(result.buffer, 0);
		view.setFloat32(0, data, littleEndian);
		return result;
	}

	/***********************************
	* @description Uint8Array数组复制
	* @param {Uint8Array} dst 目标数组
	* @param {Uint8Array} src 源数组
	* @param {Number} dstOffset 目标数组的起始位置
	* @param {Number} srcOffset 源数组的起始位置
	* @param {Number} len 需要复制的长度
	************************************/
	_utils.uint8ArrayCopy = function(dst, src, dstOffset, srcOffset, len)
	{
		if(!(dst instanceof Uint8Array)
			|| !(src instanceof Uint8Array))
		{
			throw "the params is error!";
		}
		if(typeof(dstOffset) === "undefined")
		{
			dstOffset = 0;
		}

		if(typeof(srcOffset) === "undefined")
		{
			srcOffset = 0;
		}

		if((typeof(len) === "undefined")
			|| ((srcOffset+len)>src.length))
		{
			len = src.length - srcOffset;
		}

		if((dstOffset + len) > dst.length)
		{
			len = dst.length - dstOffset;
		}
		
		for(var i=0; i<len; i++)
		{
			dst[dstOffset+i] = src[srcOffset+i];
		}
	}

	/***********************************
	* @description Uint8Array数组中的数据移动
	* @param {Uint8Array} data 数组
	* @param {Number} dstOffset 目标位置
	* @param {Number} srcOffset 源位置
	* @param {Number} len 需要移动的长度
	************************************/
	_utils.uint8ArrayMove = function(data, dstOffset, srcOffset, len)
	{
		if(!(data instanceof Uint8Array))
		{
			throw "the params is error.";
		}

		if((typeof(dstOffset) === "undefined")
			|| (typeof(srcOffset) === "undefined")
			|| (typeof(len)==="undefined"))
		{
			return;
		}

		for(var i=0; i<len; i++)
		{
			data[dstOffset+i] = data[srcOffset+i];
		}
	}

	
	/************************************************************
	* @description 两个Uint8Array数组比较
	* @param {Uint8Array} first 参与比较的第一个数组
	* @param {Uint8Array} second 参与比较的第二个数组
	* @param {Number} firstOffset 参与比较的第一个数组的起始位置
	* @param {Number} secondOffset 参与比较的第二个数组的起始位置
	* @param {Number} len 参与比较的数据长度
	* @returns {Bool} 返回比较的结果
	*************************************************************/	
	_utils.uint8ArrayCompare = function(first, second, firstOffset, secondOffset, len)
	{
		if(!(first instanceof Uint8Array)
			|| !(second instanceof Uint8Array))
		{
			return false;
		}

		if(typeof(len) === "undefined")
		{
			len = first.length;
		}

		if(typeof(secondOffset) === "undefined")
		{
			secondOffset = 0;
		}

		if(typeof(firstOffset)==="undefined")
		{
			firstOffset = 0;
		}

		if(((firstOffset+len)>first.length)
			||((secondOffset+len)>second.length))
		{
			return false;
		}

		for(var i=0; i<len; i++)
		{
			if(first[firstOffset + i] !== second[secondOffset + i])
			{
				return false;
			}
		}

		return true;
	}

	/***********************************
	* @description 填充Uint8Array数组
	* @param {Uint8Array} data 需要填充的数组
	* @param {Number} value 填充的值
	* @param {Number} offset 需要填充的起始位置，默认为0
	* @param {Number} len 需要填充的长度
	************************************/
	_utils.fillUint8Array = function(dst, value, offset, len)
	{
		if(typeof(value) === "undefined")
		{
			value = 0;
		}

		if(typeof(offset) === "undefined")
		{
			offset = 0;
		}

		if(typeof(len) === "undefined")
		{
			len = dst.length - offset;
		}

		var _nEnd = offset + len;
		if(_nEnd > dst.length)
		{
			_nEnd = dst.length;
		}
		_nEnd--;

		for(var i=offset; i<_nEnd; i++)
		{
			dst[i] = value;
		}
	}

	_utils.uint8ArrayToBcdStr = function(data, offset, len)
	{
		if(typeof(offset)==="undefined")
		{
			offset = 0;
		}
		if(typeof(len) === "undefined")
		{
			len = data.length - offset;
		}
		var _result = "";
		for(var i=0; i<len; i++)
		{
			var _tmp = data[offset + i].toString(16);
			if(_tmp.length==1)
			{
				_tmp = '0'+_tmp;
			}
			_result += _tmp;
		}
		return _result;
	}

	_utils.uint8ArrayToBcd = function(data, offset, len, littleEndian)
	{
		if(typeof(offset) === "undefined")
		{
			offset = 0;
		}

		if(typeof(len) === "undefined")
		{
			len = data.length - offset;
		}

		if(typeof(littleEndian) === "undefined")
		{
			littleEndian = true;
		}

		var _nEnd = offset + len;
		if(_nEnd > data.length)
		{
			return 0;
		}

		var _result = 0;
		var _nFactor = 1;
		for(var i=offset; i<_nEnd; i++)
		{
			if(littleEndian)
			{
				_result += data[i] * _nFactor;
			}else
			{
				_result = _result*100 + data[i];
			}
			_nFactor *= 100;
		}

		return _result;
	}

	_utils.uintToBcd = function(data)
	{
		return parseInt(data.toString(), 16);
	}

	_utils.bcdToUint = function(data)
	{
		return parseInt(data.toString(16));
	}

	_utils.bcdStrToUint8Array = function(bcdstr, len)
	{
		var strLen = 2*len;
		var _result = new Uint8Array(len);
		if(bcdstr.length < strLen)
		{
			var nTmp = strLen - bcdstr.length;
			while(nTmp > 0)
			{
				bcdstr = "0" + bcdstr;
				nTmp--;
			}
		}else if(bcdstr.length > strLen)
		{
			bcdstr = bcdstr.substr(bcdstr.length-strLen, strLen);
		}

		for(var i=0; i<len; i++)
		{
			_result[i] = parseInt(bcdstr.substr(strLen-2*(i+1), 2), 16);
		}

		return _result;
	}

	window.utils = _utils;
	
})();