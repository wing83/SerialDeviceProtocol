;(function(){
	if(window.Modbus)
	{
		throw "Had Modbus";
	}

	var _modbus = function(opts)
	{
		var options = {};

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

		var _self = this;


		this.setFunctionCode = function(funcCode)
		{
			options.functionCode = funcCode;
		}

		this.setMeterNumber = function(meterNumber)
		{
			options.meterNumber = meterNumber;
		}

		this.setStartRegAddress = function(startReg)
		{
			options.startRegAddress = startReg;
		}

		this.setRegCount = function(regCnt)
		{
			options.regCount = regCnt;
		}

		function checkCRC(data)
		{
			var nCRCResult = utils.getCRC16(new Uint8Array(data.buffer.slice(0, data.length-2)));
			var nCRC = (data[data.length-2]<<8) | (data[data.length-1]);
			return nCRC == nCRCResult;
		}

		function getReadCmd()
		{
			if((options.functionCode != FunctionCode.Read_Coil)
				&&(options.functionCode != FunctionCode.Read_DI)
				&&(options.functionCode != FunctionCode.Read_Hold_Reg)
				&&(options.functionCode != FunctionCode.Read_Input_Reg))
			{
				return null;
			}

			var _result = new Uint8Array(8);
			_result[0] = options.meterNumber;
			_result[1] = options.functionCode;
			_result[2] = options.startRegAddress >> 8;
			_result[3] = options.startRegAddress & 0xFF;
			_result[4] = options.regCount >> 8;
			_result[5] = options.regCount & 0xFF;

			var _crc16 = utils.getCRC16(new Uint8Array(_result.buffer.slice(0, 6)));

			_result[6] = _crc16>>8;
			_result[7] = _crc16 & 0xFF;

			return _result;
		}

		//return obj
		// {
		// 	"startIndex": 0,
		// 	"len": 1, 
		// 	"completed": true, 
		// 	"success": true
		// }
		function processReadCmd(data)
		{
			var _returnObj = {};
			if((options.functionCode != FunctionCode.Read_Coil)
				&&(options.functionCode != FunctionCode.Read_DI)
				&&(options.functionCode != FunctionCode.Read_Hold_Reg)
				&&(options.functionCode != FunctionCode.Read_Input_Reg))
			{
				_returnObj.startIndex = 0;
				_returnObj.len = data.length;
				_returnObj.completed = true;
				_returnObj.success = false;
				return _returnObj;
			}

			var nIndex = 0;
			var nMaxIndex = data.length-4;
			while(nIndex < nMaxIndex)
			{
				var nMeterNumber = data[nIndex];
				if(options.meterNumber != nMeterNumber)
				{
					nIndex++;
					continue;
				}
				var nFuncCode = data[nIndex+1];
				if(nFuncCode == (options.functionCode+0x80))
				{
					if(checkCRC(new Uint8Array(data.buffer.slice(nIndex, 3))))
					{
						_returnObj.startIndex = nIndex;
						_returnObj.len = 5;
						_returnObj.completed = true;
						_returnObj.success = false;
						return _returnObj;
					}
					nIndex++;
					continue;
				}else if(nFuncCode == options.functionCode)
				{
					var nDataLen = 0;
					if((options.functionCode == FunctionCode.Read_Coil)
						||(options.functionCode == FunctionCode.Read_DI))
					{
						nDataLen = parseInt(options.regCount / 8);
						if(0 != (options.regCount%8))
						{
							nDataLen++;
						}
					}else {
						nDataLen = 2*options.regCount;
					}

					if(data[nIndex+2] != nDataLen)
					{
						nIndex ++;
						continue;
					}

					if((nDataLen + 5 + nIndex)> data.length)
					{
						_returnObj.startIndex = nIndex;
						_returnObj.len = data.length-nIndex;
						_returnObj.completed = false;
						_returnObj.success = false;
						return _returnObj;
					}

					var resultArray = new Uint8Array(data.buffer.slice(nIndex, nDataLen+5));
					if(checkCRC(resultArray))
					{
						options.readResult = resultArray;
						_returnObj.startIndex = nIndex;
						_returnObj.len = resultArray.length;
						_returnObj.completed = true;
						_returnObj.success = true;
						return _returnObj;
					}else
					{
						_returnObj.startIndex = nIndex;
						_returnObj.len = resultArray.length;
						_returnObj.completed = true;
						_returnObj.success = false;
						return _returnObj;
					}

				}
			}

			_returnObj.startIndex = nIndex;
			_returnObj.len = nMaxIndex-nIndex;
			_returnObj.completed = false;
			_returnObj.success = false;
			return _returnObj;
		}

		this.getCmd = function()
		{
			if((options.functionCode == FunctionCode.Read_Coil)
				||(options.functionCode == FunctionCode.Read_DI)
				||(options.functionCode == FunctionCode.Read_Hold_Reg)
				||(options.functionCode == FunctionCode.Read_Input_Reg))
			{
				return getReadCmd();
			}else
			{
				return null;
			}
		}

		this.processCmd = function(data)
		{
			if((options.functionCode == FunctionCode.Read_Coil)
				||(options.functionCode == FunctionCode.Read_DI)
				||(options.functionCode == FunctionCode.Read_Hold_Reg)
				||(options.functionCode == FunctionCode.Read_Input_Reg))
			{
				options.readResult = null;
				return processReadCmd(data);
			}else
			{
				return null;
			}
		}

		this.getRegRawData = function(regAddress, regCount)
		{
			if((options.functionCode != FunctionCode.Read_Hold_Reg)
				&&(options.functionCode != FunctionCode.Read_Input_Reg))
			{
				return null;
			}

			if(!options.readResult)
			{
				return null;
			}

			if((regAddress<options.startRegAddress)
				||((regAddress+regCount)>(options.startRegAddress+options.regCount)))
			{
				return null;
			}

			var nIndex = 3+(regAddress - options.startRegAddress)*2;
			return new Uint8Array(options.readResult.buffer.slice(nIndex, nIndex+2*regCount));
		}

		this.getRegUint16Data = function(regAddress, littleEndian)
		{
			var result = _self.getRegRawData(regAddress, 1);
			if(null == result)
			{
				return null;
			}

			var view = new DataView(result.buffer, 0);
			return view.getUint16(0, littleEndian);
		}

		this.getRegInt16Data = function(regAddress, littleEndian)
		{
			var result = _self.getRegRawData(regAddress, 1);
			if(null == result)
			{
				return null;
			}

			var view = new DataView(result.buffer, 0);
			return view.getInt16(0, littleEndian);
		}

		this.getRegUint32Data = function(regAddress, littleEndian)
		{
			var result = _self.getRegRawData(regAddress, 2);
			if(null == result)
			{
				return null;
			}

			var view = new DataView(result.buffer, 0);
			return view.getUint32(0, littleEndian);
		}

		this.getRegInt32Data = function(regAddress, littleEndian)
		{
			var result = _self.getRegRawData(regAddress, 2);
			if(null == result)
			{
				return null;
			}

			var view = new DataView(result.buffer, 0);
			return view.getInt32(0, littleEndian);
		}

		this.getRegFloatData = function(regAddress, littleEndian)
		{
			var result = _self.getRegRawData(regAddress, 2);
			if(null == result)
			{
				return null;
			}

			var view = new DataView(result.buffer, 0);
			return view.getFloat32(0, littleEndian);
		}

		this.getCoilData = function(regAddress)
		{
			if((options.functionCode != FunctionCode.Read_Coil)
				&&(options.functionCode != FunctionCode.Read_DI))
			{
				return null;
			}

			if((regAddress < options.startRegAddress)
				||(regAddress>=(options.startRegAddress+options.regCount)))
			{
				return null;
			}

		    var nIndex = regAddress - options.startRegAddress;
		    var nIndex_d = parseInt(nIndex / 8);
		    var nIndex_m = nIndex % 8;
		    var nTmpValue = options.readResult[3+nIndex_d];
		    if((nTmpValue & (1<<nIndex_m)))
		    {
		    	return true;
		    }else
		    {
		    	return false;
		    }
		}
	}

	window.Modbus = _modbus;
})();