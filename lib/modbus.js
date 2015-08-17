;(function(){
	if(window.Modbus)
	{
		throw "Had Modbus";
	}

	var FunctionCode = {
		Empty: 0,
		Read_Coil: 1,
		Read_DI: 2,
		Read_Hold_Reg: 3,
		Read_Input_Reg: 4,
		Write_Single_Coil: 5,
		Write_Single_Reg: 6,
		Write_Serval_Coil: 15,
		Write_Serval_Reg: 16
	}

	var _modbus = function(opts)
	{
		this.options = {};

		var _self = this;

		//start init modbus params
		if(opts && opts.hasOwnProperty("functionCode"))
		{
			this.setFunctionCode(opts.functionCode);
		}else
		{
			this.options.functionCode = FunctionCode.Empty;
		}

		if(opts && opts.hasOwnProperty("meterNumber"))
		{
			this.setMeterNumber(opts.meterNumber);
		}else
		{
			this.options.meterNumber = 0;
		}

		if(opts && opts.hasOwnProperty("startRegAddress"))
		{
			this.setStartRegAddress(opts.startRegAddress);
		}else
		{
			this.options.startRegAddress = 0;
		}

		if(opts && opts.hasOwnProperty("regCount"))
		{
			this.setRegCount(opts.regCount);
		}else if(typeof(this.options.regCount) === "undefined")
		{
			this.options.regCount = 0;
		}
		//end init modbus params
	}

	_modbus.prototype.setFunctionCode = function(funcCode)
	{
		if((FunctionCode.Read_Coil !== funcCode)
			&& (FunctionCode.Read_DI !== funcCode)
			&& (FunctionCode.Read_Hold_Reg !== funcCode)
			&& (FunctionCode.Read_Input_Reg !== funcCode)
			&& (FunctionCode.Write_Single_Coil !== funcCode)
			&& (FunctionCode.Write_Serval_Reg !== funcCode)
			&& (FunctionCode.Write_Single_Coil !== funcCode)
			&& (FunctionCode.Write_Serval_Reg !== funcCode))
		{
			throw 'The function code is not correct.';
		}
		this.options.functionCode = funcCode;
		if((FunctionCode.Write_Single_Coil === funcCode)
			|| (FunctionCode.Write_Single_Reg === funcCode))
		{
			this.options.regCount = 1;
		}
	}

	_modbus.prototype.setMeterNumber = function(meterNumber)
	{
		if(isNaN(meterNumber))
		{
			throw "The meter number must be digital.";
		}else if((meterNumber<0)
			||(meterNumber>247))
		{
			throw "The meter number must between 0~247.";
		}

		this.options.meterNumber = meterNumber;
	}

	_modbus.prototype.setStartRegAddress = function(startReg)
	{
		if(isNaN(startReg))
		{
			throw "The start register address must be digital.";
		}else if((startReg<0)
			||(startReg>0xFFFF))
		{
			throw "The start register address must between 0~65535.";
		}
		this.options.startRegAddress = startReg;
	}

	_modbus.prototype.setRegCount = function(regCnt)
	{
		if(isNaN(regCnt))
		{
			throw "The register count must be digital.";
		}else if((regCnt<0)
			|| (regCnt>120))
		{
			throw "The register count must between 0~120.";
		}
		this.options.regCount = regCnt;
	}

	_modbus.prototype.getMeterNumber = function()
	{
		return this.options.meterNumber;
	}

	_modbus.prototype.getFunctionCode = function()
	{
		return this.options.functionCode;
	}

	_modbus.prototype.getErrorCode = function()
	{
		return this.options.errorCode;
	}

	_modbus.prototype.getStartRegAddress = function()
	{
		return this.options.startRegAddress;
	}

	_modbus.prototype.getRegCount = function()
	{
		return this.options.regCount;
	}

	_modbus.prototype.getDataLen = function()
	{
		return this.options.dataLen;
	}

	function checkCRC(data)
	{
		var nCRCResult = utils.getCRC16(new Uint8Array(data.buffer.slice(0, data.length-2)));
		var nCRC = (data[data.length-2]<<8) | (data[data.length-1]);
		return nCRC == nCRCResult;
	}

	_modbus.prototype.getReadCmd = function()
	{
		var _returnObj = {};
		if((this.options.functionCode != FunctionCode.Read_Coil)
			&&(this.options.functionCode != FunctionCode.Read_DI)
			&&(this.options.functionCode != FunctionCode.Read_Hold_Reg)
			&&(this.options.functionCode != FunctionCode.Read_Input_Reg))
		{
			_returnObj["result"] = null;
			_returnObj["success"] = false;
			_returnObj["msg"] = "The function code must be read cmd code.";
			return _returnObj;
		}

		var _result = new Uint8Array(8);
		var dv = new DataView(_result.buffer, 0);
		dv.setUint8(0, this.options.meterNumber);
		dv.setUint8(1, this.options.functionCode);
		dv.setUint16(2, this.options.startRegAddress, false);
		dv.setUint16(4, this.options.regCount, false);
		var _crc16 = utils.getCRC16(new Uint8Array(_result.buffer.slice(0, 6)));

		dv.setUint16(6, _crc16);

		_returnObj["result"] = _result;
		_returnObj["success"] = true;
		_returnObj["msg"] = "success";

		return _returnObj;
	}

	_modbus.prototype.setRegValueByUint8Array = function(regAddress, regRawValue)
	{
		var _returnObj = {};
		_returnObj["success"] = false;

		if((this.options.functionCode !== FunctionCode.Write_Single_Reg)
			&& (this.options.functionCode !== FunctionCode.Write_Serval_Reg))
		{
			_returnObj["msg"] = "The function code must be 0x06 or 0x10.";
			return _returnObj;
		}

		if(!(regRawValue instanceof Uint8Array))
		{
			_returnObj["msg"] = "The regRawValue must be Uint8Array type.";
			return _returnObj;
		}

		var regCount = parseInt(regRawValue.length/2);
		if(0 !== regRawValue.length%2)
		{
			regCount++;
		}

		if((regAddress<this.options.startRegAddress)
			|| ((regAddress+regCount) >= (this.options.startRegAddress+this.options.regCount)))
		{
			_returnObj["msg"] = "The register address isnot in your setting range.";
			return _returnObj;
		}

		if(null == this.options.writeData)
		{
			var nTmpLen = 2;
			if(this.options.functionCode === FunctionCode.Write_Serval_Reg)
			{
				nTmpLen = 2*this.options.regCount;
			}
			this.options.writeData = new Uint8Array(nTmpLen);
		}

		var nIndex = 2*(regAddress - this.options.startRegAddress);
		utils.uint8ArrayCopy(this.options.writeData, nIndex, regRawValue, 0, regRawValue.length);

		_returnObj["success"] = true;
		_returnObj["msg"] = "success";
		return _returnObj;
	}

	_modbus.prototype.setRegValueByUint16 = function(regAddress, regValue, littleEndian)
	{
		var _tmpData = new Uint8Array(2);
		var dv = new DataView(_tmpData.buffer, 0);
		dv.setUint16(0, regValue, littleEndian);

		return this.setRegValueByUint8Array(regAddress, _tmpData);
	}

	_modbus.prototype.setRegValueByInt16 = function(regAddress, regValue, littleEndian)
	{
		var _tmpData = new Uint8Array(2);
		var dv = new DataView(_tmpData.buffer, 0);
		dv.setInt16(0, regValue, littleEndian);

		return this.setRegValueByUint8Array(regAddress, _tmpData);
	}

	_modbus.prototype.setRegValueByUint32 = function(regAddress, regValue, littleEndian)
	{
		var _tmpData = new Uint8Array(4);
		var dv = new DataView(_tmpData.buffer, 0);
		dv.setUint32(0, regValue, littleEndian);

		return this.setRegValueByUint8Array(regAddress, _tmpData);
	}

	_modbus.prototype.setRegValueByInt32 = function(regAddress, regValue, littleEndian)
	{
		var _tmpData = new Uint8Array(4);
		var dv = new DataView(_tmpData.buffer, 0);
		dv.setInt32(0, regValue, littleEndian);

		return this.setRegValueByUint8Array(regAddress, _tmpData);
	}

	_modbus.prototype.setRegValueByFloat = function(regAddress, regValue, littleEndian)
	{
		var _tmpData = new Uint8Array(4);
		var dv = new DataView(_tmpData.buffer, 0);
		dv.setFloat(0, regValue, littleEndian);

		return this.setRegValueByUint8Array(regAddress, _tmpData);
	}

	_modbus.prototype.setCoilValue = function(regAddress, coilValue)
	{
		var _returnObj = {};
		_returnObj["success"] = false;

		if((this.options.functionCode !== FunctionCode.Write_Single_Coil)
			&& (this.options.functionCode !== FunctionCode.Write_Serval_Coil))
		{
			_returnObj["msg"] = "The function code must be 0x05 or 0x0F.";
			return _returnObj;
		}

		if((coilValue !== true)
			&& (coilValue !== false))
		{
			_returnObj["msg"] = "The coilValue must be true or false.";
			return _returnObj;
		}

		if((regAddress<this.options.startRegAddress)
			|| (regAddress >= (this.options.startRegAddress+this.options.regCount)))
		{
			_returnObj["msg"] = "The register address isnot in your setting range.";
			return _returnObj;
		}

		if(null == this.options.writeData)
		{
			var nTmpLen = 2;
			if(this.options.functionCode === FunctionCode.Write_Serval_Coil)
			{
				nTmpLen = parseInt(this.options.regCount/8);
				if(0!==(this.options.regCount%8))
				{
					nTmpLen++;
				}
			}
			this.options.writeData = new Uint8Array(nTmpLen);
			utils.fillUint8Array(this.options.writeData, 0);
		}

		if(this.options.functionCode === FunctionCode.Write_Single_Coil)
		{
			if(true === coilValue)
			{
				this.options.writeData[0] = 0xFF;
			}
		}else
		{
			var nIndex = regAddress - this.options.startRegAddress;
			var nIndex_d = parseInt(nIndex/8);
			var nIndex_m = nIndex%8;
			var nTmpValue = this.options.writeData[nIndex_d];
			var nTmpSetValue = 0xFF;
			if(false === coilValue)
			{
				nTmpSetValue = ~(1<<nIndex_m);
			}
			nTmpValue = nTmpValue & nTmpSetValue;
			this.options.writeData[nIndex_d] = nTmpValue;
		}

		_returnObj["success"] = true;
		_returnObj["msg"] = "success";
		return _returnObj;
	}

	_modbus.prototype.getWriteCmd = function()
	{
		var _returnObj = {};
		if(null === this.options.writeData)
		{
			_returnObj["result"] = null;
			_returnObj["success"] = false;
			_returnObj["msg"] = "You must set register value first.";
			return _returnObj;
		}

		if((this.options.functionCode === FunctionCode.Write_Single_Coil)
			|| (this.options.functionCode === FunctionCode.Write_Single_Reg))
		{
			var resultArray = new Uint8Array(8);
			var dv = new DataView(resultArray.buffer, 0);
			dv.setUint8(0, this.options.meterNumber);
			dv.setUint8(1, this.options.functionCode);
			dv.setUint16(2, this.options.startRegAddress, false);
			utils.uint8ArrayCopy(resultArray, 4, this.options.writeData, 0, 2);
			var _crc16 = utils.getCRC16(new Uint8Array(resultArray.buffer.slice(0, 6)));
			dv.setUint16(6, _crc16);

			_returnObj["result"] = resultArray;
			_returnObj["success"] = true;
			_returnObj["msg"] = "success";
			return _returnObj;
		}else if((this.options.functionCode === FunctionCode.Write_Serval_Coil)
			|| (this.options.functionCode === FunctionCode.Write_Serval_Reg))
		{
			var _tmpLen = 9+this.options.writeData.length;
			var resultArray = new Uint8Array(_tmpLen);
			var dv = new DataView(resultArray, 0);
			dv.setUint8(0, this.options.meterNumber);
			dv.setUint8(1, this.options.functionCode);
			dv.setUint16(2, this.options.startRegAddress, false);
			dv.setUint16(4, this.options.regCount, false);
			resultArray[7] = this.options.writeData.length;
			utils.uint8ArrayCopy(resultArray, 8, this.options.writeData, 0, this.options.writeData.length);
			var _crc16 = utils.getCRC16(new Uint8Array(resultArray.buffer.slice(0, _tmpLen-2)));
			dv.setUint16(_tmpLen-2, _crc16);
			
			_returnObj["result"] = resultArray;
			_returnObj["success"] = true;
			_returnObj["msg"] = "success";
			return _returnObj;
		}else
		{
			_returnObj["result"] = null;
			_returnObj["success"] = false;
			_returnObj["msg"] = "The function code must be write cmd code.";
			return _returnObj;
		}
	}

	_modbus.prototype.getCmd = function()
	{
		if((this.options.functionCode === FunctionCode.Read_Coil)
			||(this.options.functionCode === FunctionCode.Read_DI)
			||(this.options.functionCode === FunctionCode.Read_Hold_Reg)
			||(this.options.functionCode === FunctionCode.Read_Input_Reg))
		{
			return this.getReadCmd();
		}else if((this.options.functionCode === FunctionCode.Write_Single_Coil)
			||(this.options.functionCode === FunctionCode.Write_Serval_Coil)
			||(this.options.functionCode === FunctionCode.Write_Single_Reg)
			||(this.options.functionCode === FunctionCode.Write_Serval_Reg))
		{
			return this.getWriteCmd();
		}
		else
		{
			var _returnObj = {};
			_returnObj["result"] = null;
			_returnObj["success"] = false;
			_returnObj["msg"] = "The function code isnot support.";
			return _returnObj;
		}
	}

	_modbus.prototype.getRegValueForUint8Array = function(regAddress, regCount)
	{
		var _returnObj = {};
		_returnObj["result"] = null;
		_returnObj["success"] = false;
		if((this.options.functionCode != FunctionCode.Read_Hold_Reg)
			&&(this.options.functionCode != FunctionCode.Read_Input_Reg))
		{
			_returnObj["msg"] = "The function code must be 0x03 or 0x04.";
			return _returnObj;
		}

		if(!this.options.parseResult)
		{
			_returnObj["msg"] = "You must parse cmd data before.";
			return _returnObj;
		}

		if(typeof(regCount) === "undefined")
		{
			regCount = 1;
		}

		if((regAddress<this.options.startRegAddress)
			||((regAddress+regCount)>(this.options.startRegAddress+this.options.regCount)))
		{
			_returnObj["msg"] = "The register address isnot in the range.";
			return _returnObj;
		}

		var nIndex = 3+(regAddress - this.options.startRegAddress)*2;
		_returnObj["result"] = new Uint8Array(this.options.parseResult.buffer.slice(nIndex, nIndex+2*regCount));
		_returnObj["success"] = true;
		_returnObj["msg"] = "success";
		return _returnObj;
	}

	_modbus.prototype.getRegValueForUint16 = function(regAddress, littleEndian)
	{
		var _returnObj = this.getRegValueForUint8Array(regAddress, 1);
		if(!_returnObj.success)
		{
			return _returnObj;
		}

		var dv = new DataView(_returnObj["result"].buffer, 0);
		_returnObj["result"] = dv.getUint16(0, littleEndian);
		_returnObj["success"] = true;
		_returnObj["msg"] = "success";
		return _returnObj;
	}

	_modbus.prototype.getRegValueForInt16 = function(regAddress, littleEndian)
	{
		var _returnObj = this.getRegValueForUint8Array(regAddress, 1);
		if(!_returnObj.success)
		{
			return _returnObj;
		}

		var dv = new DataView(_returnObj["result"].buffer, 0);
		_returnObj["result"] = dv.getInt16(0, littleEndian);
		_returnObj["success"] = true;
		_returnObj["msg"] = "success";
		return _returnObj;
	}

	_modbus.prototype.getRegValueForUint32 = function(regAddress, littleEndian)
	{
		var _returnObj = this.getRegValueForUint8Array(regAddress, 2);
		if(!_returnObj.success)
		{
			return _returnObj;
		}

		var dv = new DataView(_returnObj["result"].buffer, 0);
		_returnObj["result"] = dv.getUint32(0, littleEndian);
		_returnObj["success"] = true;
		_returnObj["msg"] = "success";
		return _returnObj;
	}

	_modbus.prototype.getRegValueForInt32 = function(regAddress, littleEndian)
	{
		var _returnObj = this.getRegValueForUint8Array(regAddress, 2);
		if(!_returnObj.success)
		{
			return _returnObj;
		}

		var dv = new DataView(_returnObj["result"].buffer, 0);
		_returnObj["result"] = dv.getInt32(0, littleEndian);
		_returnObj["success"] = true;
		_returnObj["msg"] = "success";
		return _returnObj;
	}

	_modbus.prototype.getRegValueForFloat = function(regAddress, littleEndian)
	{
		var _returnObj = this.getRegValueForUint8Array(regAddress, 2);
		if(!_returnObj.success)
		{
			return _returnObj;
		}

		var dv = new DataView(_returnObj["result"].buffer, 0);
		_returnObj["result"] = dv.getFloat32(0, littleEndian);
		_returnObj["success"] = true;
		_returnObj["msg"] = "success";
		return _returnObj;
	}

	_modbus.prototype.getCoilValue = function(regAddress)
	{
		var _returnObj = {};
		_returnObj["result"] = null;
		_returnObj["success"] = false;
		if((this.options.functionCode != FunctionCode.Read_Coil)
			&&(this.options.functionCode != FunctionCode.Read_DI))
		{
			_returnObj["msg"] = "The function code isnot correct.";
			return _returnObj;
		}

		if((regAddress < this.options.startRegAddress)
			||(regAddress>=(this.options.startRegAddress+this.options.regCount)))
		{
			_returnObj["msg"] = "The register address isnot in the range.";
			return _returnObj;
		}

	    var nIndex = regAddress - this.options.startRegAddress;
	    var nIndex_d = parseInt(nIndex / 8);
	    var nIndex_m = nIndex % 8;
	    var nTmpValue = this.options.parseResult[3+nIndex_d];
	    if((nTmpValue & (1<<nIndex_m)))
	    {
	    	_returnObj["result"] = true;
	    }else
	    {
	    	_returnObj["result"] = false;
	    }
	    _returnObj["success"] = true;
	    _returnObj["msg"] = "success";
	    return _returnObj;
	}

	_modbus.prototype.getRegWriteValueForUint8Array = function()
	{
		var _returnObj = {};
		_returnObj["result"] = null;
		_returnObj["success"] = false;
		if(this.options.functionCode !== FunctionCode.Write_Single_Reg)
		{
			_returnObj["msg"] = "The function code must be 0x06.";
			return _returnObj;
		}

		if(null == this.options.parseResult)
		{
			_returnObj["msg"] = "You must parse received data before.";
			return _returnObj;
		}

		_returnObj["result"] = new Uint8Array(this.options.parseResult.buffer.slice(4, 6)); 
		_returnObj["success"] = true;
		_returnObj["msg"] = "success";
		return _returnObj;
	}

	_modbus.prototype.getRegWriteValueForUint16 = function(littleEndian)
	{
		var _returnObj = this.getRegWriteValueForUint8Array();
		if(!_returnObj.success)
		{
			return _returnObj;
		}

		var dv = new DataView(_returnObj["result"].buffer, 0);
		_returnObj["result"] = dv.getUint16(0, littleEndian);
		_returnObj["success"] = true;
		_returnObj["msg"] = "success";
		return _returnObj;
	}

	_modbus.prototype.getRegWriteValueForInt16 = function(littleEndian)
	{
		var _returnObj = this.getRegWriteValueForUint8Array();
		if(!_returnObj.success)
		{
			return _returnObj;
		}

		var dv = new DataView(_returnObj["result"].buffer, 0);
		_returnObj["result"] = dv.getInt16(0, littleEndian);
		_returnObj["success"] = true;
		_returnObj["msg"] = "success";
		return _returnObj;
	}

	_modbus.prototype.getCoilWriteValue = function()
	{
		var _returnObj = {};
		_returnObj["result"] = null;
		_returnObj["success"] = false;
		if(this.options.functionCode !== FunctionCode.Write_Single_Coil)
		{
			_returnObj["msg"] = "The function code must be 0x06.";
			return _returnObj;
		}

		if(null == this.options.parseResult)
		{
			_returnObj["msg"] = "You must parse received data before.";
			return _returnObj;
		}

		if((0xFF===this.options.parseResult[4])
			&& (0x00===this.options.parseResult[5]))
		{
			_returnObj["result"] = true;
		}else if((0x00===this.options.parseResult[4])
			&& (0x00===this.options.parseResult[5]))
		{
			_returnObj["result"] = false;
		}else
		{
			_returnObj["msg"] = "The data isnot correct.";
			return _returnObj;
		}

		_returnObj["success"] = true;
		_returnObj["msg"] = "success";
		return _returnObj;
	}

	//return obj
	// {
	// 	"startIndex": 0,
	// 	"len": 1, 
	// 	"completed": true, 
	// 	"success": true
	// }
	_modbus.prototype.parseCmd = function(data)
	{
		//初始化为null
		this.options.parseResult = null;
		var _returnObj = {};
		var nIndex = 0;
		var nMaxIndex = data.length-4;
		while(nIndex < nMaxIndex)
		{
			var nMeterNumber = data[nIndex];
			if((nMeterNumber<=0)
				||(nMeterNumber>247))
			{
				nIndex++;
				continue;
			}
			var nFuncCode = data[nIndex+1];
			if(nFuncCode > 0x80)  //判断是否为异常功能码
			{
				var resultArray = new Uint8Array(data.buffer.slice(nIndex, nIndex+5));
				if(checkCRC(resultArray))
				{
					this.options.parseResult = resultArray;
					this.options.meterNumber = nMeterNumber;
					this.options.functionCode = nFuncCode;
					this.options.errorCode = data[nIndex+2];
					_returnObj.startIndex = nIndex;
					_returnObj.len = 5;
					_returnObj.completed = true;
					_returnObj.success = false;
					return _returnObj;
				}
				nIndex++;
				continue;
			}else if((nFuncCode === FunctionCode.Read_Coil) //判断是否为读
				|| (nFuncCode === FunctionCode.Read_DI)
				|| (nFuncCode === FunctionCode.Read_Hold_Reg)
				|| (nFuncCode === FunctionCode.Read_Input_Reg))
			{
				var nDataLen = data[nIndex+2];
				if((nDataLen + 5 + nIndex)> data.length)
				{
					_returnObj.startIndex = nIndex;
					_returnObj.len = data.length-nIndex;
					_returnObj.completed = false;
					_returnObj.success = false;
					return _returnObj;
				}

				var resultArray = new Uint8Array(data.buffer.slice(nIndex, nIndex+nDataLen+5));
				if(checkCRC(resultArray))
				{
					this.options.parseResult = resultArray;
					this.options.meterNumber = nMeterNumber;
					this.options.functionCode = nFuncCode;
					this.options.dataLen = nDataLen;
					_returnObj.startIndex = nIndex;
					_returnObj.len = resultArray.length;
					_returnObj.completed = true;
					_returnObj.success = true;
					return _returnObj;
				}else
				{
					nIndex++;
					continue;
				}
			}else if((nFuncCode === FunctionCode.Write_Single_Coil)
				|| (nFuncCode === FunctionCode.Write_Single_Reg)
				|| (nFuncCode === FunctionCode.Write_Serval_Coil)
				|| (nFuncCode === FunctionCode.Write_Serval_Reg))
			{
				if((8 + nIndex)> data.length)
				{
					_returnObj.startIndex = nIndex;
					_returnObj.len = data.length-nIndex;
					_returnObj.completed = false;
					_returnObj.success = false;
					return _returnObj;
				}
				var resultArray = new Uint8Array(data.buffer.slice(nIndex, nIndex+8));
				if(checkCRC(resultArray))
				{
					this.options.parseResult = resultArray;
					this.options.meterNumber = nMeterNumber;
					this.options.functionCode = nFuncCode;
					var dv = new DataView(resultArray.buffer);
					this.options.startRegAddress = dv.getUint16(2);
					if((nFuncCode === FunctionCode.Write_Serval_Coil)
						|| (nFuncCode === FunctionCode.Write_Serval_Reg))
					{
						this.options.regCount = dv.getUint16(4);
					}
					_returnObj.startIndex = nIndex;
					_returnObj.len = resultArray.length;
					_returnObj.completed = true;
					_returnObj.success = true;
					return _returnObj;
				}else
				{
					nIndex++;
					continue;
				}
			}else 
			{
				nIndex++;
				continue;
			}
		}

		_returnObj.startIndex = nIndex;
		_returnObj.len = nMaxIndex-nIndex;
		_returnObj.completed = false;
		_returnObj.success = false;
		return _returnObj;
	}

	window.Modbus = _modbus;
})();