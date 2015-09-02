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

	/************************************************************
	* @description 构建一个Modbus对象
	* @param {Object} opts : 
	*						meterNumber{Number} 表号
	*						functionCode{Number} 功能码
	*					    startRegAddress{Number} 起始寄存器
	*						regCount{Number} 寄存器个数 
	*************************************************************/	
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

		this.writeData = null;
		this.parseResult = null;
		//end init modbus params
	}

	/************************************************************
	* @description 设置功能码
	* @param {Number} funcCode 功能码
	*************************************************************/	
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

	/************************************************************
	* @description 设置表号
	* @param {Number} meterNumber 表号大于等于0，小于247，等于0为广播地址
	*************************************************************/	
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

	/************************************************************
	* @description 设置起始寄存器
	* @param {Number} startReg 起始寄存器
	*************************************************************/	
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

	/************************************************************
	* @description 设置寄存器个数
	* @param {Number} regCnt 寄存器个数据，不能大于120
	*************************************************************/	
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

	/************************************************************
	* @description 返回表号
	* @returns {Number} 表号
	*************************************************************/	
	_modbus.prototype.getMeterNumber = function()
	{
		return this.options.meterNumber;
	}

	/************************************************************
	* @description 返回功能码
	* @returns {Number} 功能码
	*************************************************************/	
	_modbus.prototype.getFunctionCode = function()
	{
		return this.options.functionCode;
	}

	/************************************************************
	* @description 返回异常码，当处理异常报文时才可以返回该值
	* @returns {Number} 异常码
	*************************************************************/	
	_modbus.prototype.getErrorCode = function()
	{
		return this.options.errorCode;
	}

	/************************************************************
	* @description 返回起始寄存器地址
	* @returns {Number} 起始寄存器地址
	*************************************************************/	
	_modbus.prototype.getStartRegAddress = function()
	{
		return this.options.startRegAddress;
	}

	/************************************************************
	* @description 返回起始寄存器个数
	* @returns {Number} 寄存器个数
	*************************************************************/	
	_modbus.prototype.getRegCount = function()
	{
		return this.options.regCount;
	}

	/************************************************************
	* @description 返回数据内容的长度, 只有在调用parseCmd成功后，
	*			   且功能码为1、2、3、4时才可以调用该函数。
	* @returns {Number} 数据内容的长度
	*************************************************************/
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

	/************************************************************
	* @description 设置寄存器的值，只有在功能码设置为0x06或0x10时，
	*			   且调用setStartRegAddress(设置起始寄存器)与
	*			   setRegCount(设置寄存器个数)之后才可以调用该函数。
	* @param {Number} regAddress 寄存器个地址
	* @param {Uint8Array} regRawValue 数据内容
	* @returns {Object} result: 
	*						 success{Bool} 是否设置成功
	*						 msg{String} 错误信息提示
	*************************************************************/
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
			|| ((regAddress+regCount) > (this.options.startRegAddress+this.options.regCount)))
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
		utils.uint8ArrayCopy(this.options.writeData, regRawValue, nIndex, 0, regRawValue.length);

		_returnObj["success"] = true;
		_returnObj["msg"] = "success";
		return _returnObj;
	}

	/************************************************************
	* @description 设置寄存器的值，只有在功能码设置为0x06或0x10时，
	*			   且调用setStartRegAddress(设置起始寄存器)与
	*			   setRegCount(设置寄存器个数)之后才可以调用该函数。
	* @param {Number} regAddress 寄存器个地址
	* @param {Number} regValue 数据内容, Uint16类型
	* @param {Bool} littleEndian 是否为小端模式，默认为true
	* @returns {Object} result: 
	*						 success{Bool} 是否设置成功
	*						 msg{String} 错误信息提示
	*************************************************************/
	_modbus.prototype.setRegValueByUint16 = function(regAddress, regValue, littleEndian)
	{
		var _tmpData = new Uint8Array(2);
		var dv = new DataView(_tmpData.buffer, 0);
		dv.setUint16(0, regValue, littleEndian);

		return this.setRegValueByUint8Array(regAddress, _tmpData);
	}

	/************************************************************
	* @description 设置寄存器的值，只有在功能码设置为0x06或0x10时，
	*			   且调用setStartRegAddress(设置起始寄存器)与
	*			   setRegCount(设置寄存器个数)之后才可以调用该函数。
	* @param {Number} regAddress 寄存器个地址
	* @param {Number} regValue 数据内容, Int16类型
	* @param {Bool} littleEndian 是否为小端模式，默认为true
	* @returns {Object} result: 
	*						 success{Bool} 是否设置成功
	*						 msg{String} 错误信息提示
	*************************************************************/
	_modbus.prototype.setRegValueByInt16 = function(regAddress, regValue, littleEndian)
	{
		var _tmpData = new Uint8Array(2);
		var dv = new DataView(_tmpData.buffer, 0);
		dv.setInt16(0, regValue, littleEndian);

		return this.setRegValueByUint8Array(regAddress, _tmpData);
	}

	/************************************************************
	* @description 设置寄存器的值，只有在功能码设置为0x06或0x10时，
	*			   且调用setStartRegAddress(设置起始寄存器)与
	*			   setRegCount(设置寄存器个数)之后才可以调用该函数。
	* @param {Number} regAddress 寄存器个地址
	* @param {Number} regValue 数据内容, Uint32类型
	* @param {Bool} littleEndian 是否为小端模式，默认为true
	* @returns {Object} result: 
	*						 success{Bool} 是否设置成功
	*						 msg{String} 错误信息提示
	*************************************************************/
	_modbus.prototype.setRegValueByUint32 = function(regAddress, regValue, littleEndian)
	{
		var _tmpData = new Uint8Array(4);
		var dv = new DataView(_tmpData.buffer, 0);
		dv.setUint32(0, regValue, littleEndian);

		return this.setRegValueByUint8Array(regAddress, _tmpData);
	}

	/************************************************************
	* @description 设置寄存器的值，只有在功能码设置为0x06或0x10时，
	*			   且调用setStartRegAddress(设置起始寄存器)与
	*			   setRegCount(设置寄存器个数)之后才可以调用该函数。
	* @param {Number} regAddress 寄存器个地址
	* @param {Number} regValue 数据内容, Int32类型
	* @param {Bool} littleEndian 是否为小端模式，默认为true
	* @returns {Object} result: 
	*						 success{Bool} 是否设置成功
	*						 msg{String} 错误信息提示
	*************************************************************/
	_modbus.prototype.setRegValueByInt32 = function(regAddress, regValue, littleEndian)
	{
		var _tmpData = new Uint8Array(4);
		var dv = new DataView(_tmpData.buffer, 0);
		dv.setInt32(0, regValue, littleEndian);

		return this.setRegValueByUint8Array(regAddress, _tmpData);
	}

	/************************************************************
	* @description 设置寄存器的值，只有在功能码设置为0x06或0x10时，
	*			   且调用setStartRegAddress(设置起始寄存器)与
	*			   setRegCount(设置寄存器个数)之后才可以调用该函数。
	* @param {Number} regAddress 寄存器个地址
	* @param {Number} regValue 数据内容, Float类型
	* @param {Bool} littleEndian 是否为小端模式，默认为true
	* @returns {Object} result: 
	*						 success{Bool} 是否设置成功
	*						 msg{String} 错误信息提示
	*************************************************************/
	_modbus.prototype.setRegValueByFloat = function(regAddress, regValue, littleEndian)
	{
		var _tmpData = new Uint8Array(4);
		var dv = new DataView(_tmpData.buffer, 0);
		dv.setFloat(0, regValue, littleEndian);

		return this.setRegValueByUint8Array(regAddress, _tmpData);
	}

	/************************************************************
	* @description 设置线圈的值，只有在功能码设置为0x05或0x0F时，
	*			   且调用setStartRegAddress(设置起始寄存器)与
	*			   setRegCount(设置寄存器个数)之后才可以调用该函数。
	* @param {Number} regAddress 寄存器个地址
	* @param {Bool} coilValue 数据内容
	* @returns {Object} result: 
	*						 success{Bool} 是否设置成功
	*						 msg{String} 错误信息提示
	*************************************************************/
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
			utils.uint8ArrayCopy(resultArray, this.options.writeData, 4, 0, 2);
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
			var dv = new DataView(resultArray.buffer, 0);
			dv.setUint8(0, this.options.meterNumber);
			dv.setUint8(1, this.options.functionCode);
			dv.setUint16(2, this.options.startRegAddress, false);
			dv.setUint16(4, this.options.regCount, false);
			resultArray[6] = this.options.writeData.length;
			utils.uint8ArrayCopy(resultArray, this.options.writeData, 7, 0, this.options.writeData.length);
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

	/************************************************************
	* @description 返回报文，在设置完Modbus的各参数之后，
	*			   调用函数返回modbus报文。
	* @returns {Object} result: 
	*						 result{Uint8Array} 报文数据，如果失败则为null
	*						 success{Bool} 是否设置成功
	*						 msg{String} 错误信息提示
	*************************************************************/
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

	/*******************************************************************************
	* @description 获取寄存器中的值，在调用parseCmd函数解析报文成功后，
	*			   且功能码为0x03或0x04，调用该函数前还需要设置起始地址与寄存器个数。
	* @param {Number} regAddress 寄存器地址
	* @param {Number} regCount 寄存器个数
	* @returns {Object} result: 
	*						 result{Uint8Array} 返回数据，如果失败则为null
	*						 success{Bool} 是否获取成功
	*						 msg{String} 错误信息提示
	*****************************************************************************/
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

	/*******************************************************************************
	* @description 获取寄存器中的值，在调用parseCmd函数解析报文成功后，
	*			   且功能码为0x03或0x04，调用该函数前还需要设置起始地址与寄存器个数。
	* @param {Number} regAddress 寄存器地址
	* @param {Bool} littleEndian 是否为小端模式
	* @returns {Object} result: 
	*						 result{Number} 返回数据，如果失败则为null
	*						 success{Bool} 是否获取成功
	*						 msg{String} 错误信息提示
	*****************************************************************************/
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

	/*******************************************************************************
	* @description 获取寄存器中的值，在调用parseCmd函数解析报文成功后，
	*			   且功能码为0x03或0x04，调用该函数前还需要设置起始地址与寄存器个数。
	* @param {Number} regAddress 寄存器地址
	* @param {Bool} littleEndian 是否为小端模式
	* @returns {Object} result: 
	*						 result{Number} 返回数据，如果失败则为null
	*						 success{Bool} 是否获取成功
	*						 msg{String} 错误信息提示
	*****************************************************************************/
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

	/*******************************************************************************
	* @description 获取寄存器中的值，在调用parseCmd函数解析报文成功后，
	*			   且功能码为0x03或0x04，调用该函数前还需要设置起始地址与寄存器个数。
	* @param {Number} regAddress 寄存器地址
	* @param {Bool} littleEndian 是否为小端模式
	* @returns {Object} result: 
	*						 result{Number} 返回数据，如果失败则为null
	*						 success{Bool} 是否获取成功
	*						 msg{String} 错误信息提示
	*****************************************************************************/
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

	/*******************************************************************************
	* @description 获取寄存器中的值，在调用parseCmd函数解析报文成功后，
	*			   且功能码为0x03或0x04，调用该函数前还需要设置起始地址与寄存器个数。
	* @param {Number} regAddress 寄存器地址
	* @param {Bool} littleEndian 是否为小端模式
	* @returns {Object} result: 
	*						 result{Number} 返回数据，如果失败则为null
	*						 success{Bool} 是否获取成功
	*						 msg{String} 错误信息提示
	*****************************************************************************/
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

	/*******************************************************************************
	* @description 获取寄存器中的值，在调用parseCmd函数解析报文成功后，
	*			   且功能码为0x03或0x04，调用该函数前还需要设置起始地址与寄存器个数。
	* @param {Number} regAddress 寄存器地址
	* @param {Bool} littleEndian 是否为小端模式
	* @returns {Object} result: 
	*						 result{Number} 返回数据，如果失败则为null
	*						 success{Bool} 是否获取成功
	*						 msg{String} 错误信息提示
	*****************************************************************************/
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

	/*******************************************************************************
	* @description 获取线圈值，在调用parseCmd函数解析报文成功后，
	*			   且功能码为0x01或0x02，调用该函数前还需要设置起始地址与寄存器个数。
	* @param {Number} regAddress 寄存器地址
	* @returns {Object} result: 
	*						 result{Bool} 返回数据，如果失败则为null
	*						 success{Bool} 是否获取成功
	*						 msg{String} 错误信息提示
	*****************************************************************************/
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

	/*******************************************************************************
	* @description 获取写入寄存器的值，用于检查收到的报文是否与当前的匹配，
	*			   在调用parseCmd函数解析报文成功后，
	*			   且功能码为0x06或0x10。
	* @returns {Object} result: 
	*						 result{Uint8Array} 返回数据，如果失败则为null
	*						 success{Bool} 是否获取成功
	*						 msg{String} 错误信息提示
	*****************************************************************************/
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

	/*******************************************************************************
	* @description 获取写入寄存器的值，用于检查收到的报文是否与当前的匹配，
	*			   在调用parseCmd函数解析报文成功后，
	*			   且功能码为0x06或0x10。
	* @param {Bool} littleEndian 是否为小端模式
	* @returns {Object} result: 
	*						 result{Number} 返回数据，如果失败则为null
	*						 success{Bool} 是否获取成功
	*						 msg{String} 错误信息提示
	*****************************************************************************/
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

	/*******************************************************************************
	* @description 获取写入寄存器的值，用于检查收到的报文是否与当前的匹配，
	*			   在调用parseCmd函数解析报文成功后，
	*			   且功能码为0x06或0x10。
	* @param {Bool} littleEndian 是否为小端模式
	* @returns {Object} result: 
	*						 result{Number} 返回数据，如果失败则为null
	*						 success{Bool} 是否获取成功
	*						 msg{String} 错误信息提示
	*****************************************************************************/
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

	/*******************************************************************************
	* @description 获取写入线圈的值，用于检查收到的报文是否与当前的匹配，
	*			   在调用parseCmd函数解析报文成功后，
	*			   且功能码为0x05或0x0F。
	* @returns {Object} result: 
	*						 result{Bool} 返回数据，如果失败则为null
	*						 success{Bool} 是否获取成功
	*						 msg{String} 错误信息提示
	*****************************************************************************/
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
	_modbus.prototype.parseCmd = function(data, offset, len)
	{
		if(typeof(offset) === "undefined")
		{
			offset = 0;
		}

		if((typeof(len) === "undefined") 
			|| ((offset + len) > data.length))
		{
			len = data.length - offset;
		}
		
		//初始化为null
		this.options.parseResult = null;
		var _returnObj = {};
		var nIndex = offset;
		var nMaxIndex = offset + len -4;
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
			if((nFuncCode === (0x80+FunctionCode.Read_Coil))
				|| (nFuncCode === (0x80+FunctionCode.Read_DI))
				|| (nFuncCode === (0x80+FunctionCode.Read_Hold_Reg))
				|| (nFuncCode === (0x80+FunctionCode.Read_Input_Reg))
				|| (nFuncCode === (0x80+FunctionCode.Write_Single_Coil))
				|| (nFuncCode === (0x80+FunctionCode.Write_Single_Reg))
				|| (nFuncCode === (0x80+FunctionCode.Write_Serval_Reg))
				|| (nFuncCode === (0x80+FunctionCode.Write_Serval_Coil)))  //判断是否为异常功能码
			{
				if((nIndex+5)>data.length)
				{
					nIndex++;
					continue;
				}
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
					nIndex++;
					continue;
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
					nIndex++;
					continue;
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

		_returnObj.startIndex = 0;
		_returnObj.len = 0;
		_returnObj.completed = false;
		_returnObj.success = false;
		return _returnObj;
	}

	window.Modbus = _modbus;
})();