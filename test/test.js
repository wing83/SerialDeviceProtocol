$(document).ready(function(){
	$("#idCRC16Test").click(function(){
		var _data1 = new Uint8Array([0x01, 0x03, 0x00, 0x0A, 0x00, 0x03]);
		var _result1 = utils.getCRC16(_data1);
		if(0x25C9 != _result1)
		{
			console.log("Error!");
		}else
		{
			console.log("_data1 pass");
		}
	});

	function modbusTest01()
	{
		var modbus = new Modbus();
		modbus.setMeterNumber(0x01);
		modbus.setFunctionCode(0x03);
		modbus.setStartRegAddress(0x00);
		modbus.setRegCount(0x02);
		var _result1 = modbus.getCmd();
		var _data1 = new Uint8Array([0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0xC4, 0x0B]);

		if(_result1 == null || !(_result1 instanceof Uint8Array))
		{
			throw "_result1 not right";
		}

		if(_result1.length != _data1.length)
		{
			throw "_result1's length is not right";
		}

		for(var i=0; i<_result1.length; i++)
		{
			if(_result1[i] != _data1[i])
			{
				throw "_result1 index of "+i+" data is not right";
			}
		}

		var _dataReturn1 = new Uint8Array([0x01, 0x03, 0x04, 0xAE, 0x17, 0x43, 0x44, 0x5B, 0xDC]);

		var _resultObj = modbus.processCmd(_dataReturn1);

		if(_resultObj.success)
		{
			var nValue = modbus.getRegFloatData(0, true);
		}


		console.log("pass");
	}

	function modbusTest02()
	{
		var _sendData_1 = new Uint8Array([0x11, 0x03, 0x01, 0x30, 0x00, 0x03, 0x06, 0xA8]);
		var _recvData_1 = new Uint8Array([0x11, 0x03, 0x06, 0x13, 0x88, 0x03, 0xE7, 0x03, 0xE9, 0x7F, 0x04]);

		var modbus = new Modbus();
		modbus.setMeterNumber(0x11);
		modbus.setFunctionCode(0x03);
		modbus.setStartRegAddress(0x130);
		modbus.setRegCount(0x03);

		var _result1 = modbus.getCmd();

		if(_result1==null || !(_result1 instanceof Uint8Array))
		{
			throw "getCmd Error";
		}

		if(_result1.length != _sendData_1.length)
		{
			throw "getCmd's return data's length is not right.";
		}

		for(var i=0; i<_sendData_1.length; i++)
		{
			if(_result1[i] != _sendData_1[i])
			{
				throw "_result1 index of "+i+" data is not right";
			}
		}

		var _resultObj = modbus.processCmd(_recvData_1);

		if((_resultObj.startIndex != 0)
			|| (_resultObj.len != _recvData_1.length)
			|| (_resultObj.completed != true)
			|| (_resultObj.success != true))
		{
			throw "recv Data Process Error!";
		}

		var nF = modbus.getRegUint16Data(0x130);
		var nV = modbus.getRegUint16Data(0x131);
		var nV2 = modbus.getRegUint16Data(0x132);

	}

	function modbusTest03()
	{
		var _sendData = new Uint8Array([0x03, 0x02, 0x00, 0x00, 0x00, 0x0C, 0x79, 0xED]);
		var _recvData = new Uint8Array([0x03, 0x02, 0x02, 0x02, 0x00, 0xC1, 0x18]);

		var modbus = new Modbus();
		modbus.setMeterNumber(0x03);
		modbus.setFunctionCode(0x02);
		modbus.setStartRegAddress(0x00);
		modbus.setRegCount(0x0C);
		var _result = modbus.getCmd();

		if(_result==null || !(_result instanceof Uint8Array))
		{
			throw "getCmd Error";
		}

		if(_result.length != _sendData.length)
		{
			throw "getCmd's return data's length is not right.";
		}

		for(var i=0; i<_sendData.length; i++)
		{
			if(_result[i] != _sendData[i])
			{
				throw "_result1 index of "+i+" data is not right";
			}
		}

		var _resultObj = modbus.processCmd(_recvData);
		if((_resultObj.startIndex != 0)
			|| (_resultObj.len != _recvData.length)
			|| (_resultObj.completed != true)
			|| (_resultObj.success != true))
		{
			throw "recv Data Process Error!";
		}

		var _DI2 = modbus.getCoilData(0x01);

		var _DI12 = modbus.getCoilData(0x0B);

	}

	$("#idModBusTest").click(function(){
		modbusTest03();
	});
});