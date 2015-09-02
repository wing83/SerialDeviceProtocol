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

	function modbusReadTest()
	{
		var testArray = new Array();
		var testItemReadCoil = {};
		testItemReadCoil["meterNumber"] = 0x01;
		testItemReadCoil["functionCode"] = 0x01;
		testItemReadCoil["startRegAddress"] = 0x13;
		testItemReadCoil["regCount"] = 0x13;
		testItemReadCoil["resultCmd"] = new Uint8Array([0x01, 0x01, 0x00, 0x13, 0x00, 0x13, 0x8C, 0x02]);
		testArray = testArray.concat(testItemReadCoil);

		testArray.forEach(function(element, index, array){
			var modbus = new Modbus(element);
			var _result = modbus.getCmd();
			if(!utils.uint8ArrayCompare(element.resultCmd, _result["result"]))
			{
				throw "The index of " + index + " not pass.";
			}
		});
	}

	function modbusWriteTest()
	{
		var testArray = new Array();
		var testItemWriteOneCoil = {};
		testItemWriteOneCoil["meterNumber"] = 0x01;
		testItemWriteOneCoil["functionCode"] = 0x05;
		testItemWriteOneCoil["startRegAddress"] = 0xAC;
		testItemWriteOneCoil["writeData"] = [{
			"regAddress": 0xAC,
			"value": true,
		}];
		testItemWriteOneCoil["resultCmd"] = new Uint8Array([0x01, 0x05, 0x00, 0xAC, 0xFF, 0x00, 0x4C, 0x1B]);
		testArray = testArray.concat(testItemWriteOneCoil);

		testArray.forEach(function(element, index, array){
			var modbus = new Modbus(element);

			if((0x05==element["functionCode"])
				|| (0x0F==element["functionCode"]))
			{
				element["writeData"].forEach(function(item){
					modbus.setCoilValue(item["regAddress"], item["value"]);
				});
			}

			var _result = modbus.getCmd();
			if(!utils.uint8ArrayCompare(element.resultCmd, _result["result"]))
			{
				throw "The index of " + index + " not pass.";
			}
		});
	}

	
	function modbusParseReadTest() 
	{
		var testArray = new Array();
		var testItemReadCoil = {};
		testItemReadCoil["meterNumber"] = 0x01;
		testItemReadCoil["functionCode"] = 0x01;
		testItemReadCoil["startRegAddress"] = 0x13;
		testItemReadCoil["regCount"] = 0x13;
		testItemReadCoil["readData"] = [{
				"regAddress": 0x13,
				"value": true,
			},
			{
				"regAddress": 0x14,
				"value": false,
			},
			{
				"regAddress": 0x17,
				"value": false,
			},
			{
				"regAddress": 0x1B,
				"value": true,
			}];
		testItemReadCoil["resultCmd"] = new Uint8Array([0x01, 0x01, 0x03, 0xCD, 0x6B, 0x05, 0x42, 0x82]);
		testArray = testArray.concat(testItemReadCoil);

		var testItemReadReg = {};
		testItemReadReg["meterNumber"] = 0x01;
		testItemReadReg["functionCode"] = 0x03;
		testItemReadReg["startRegAddress"] = 0x6B;
		testItemReadReg["regCount"] = 0x03;
		testItemReadReg["readData"] = [{
				"regAddress": 0x6B,
				"regCount" : 1,
				"value": new Uint8Array([0x02, 0x2B]),
				"type": "rawData"
			},
			{
				"regAddress": 0x6B,
				"value": 555,
				"type": "uint16"
			},
			{
				"regAddress": 0x6C,
				"value": new Uint8Array([0x00, 0x00]),
				"type": "rawData"
			},
			{
				"regAddress": 0x6D,
				"value": new Uint8Array([0x00, 0x64]),
				"type": "rawData"
			}];
		testItemReadReg["resultCmd"] = new Uint8Array([0x01, 0x03, 0x06, 0x02, 0x2B, 0x00, 0x00, 0x00, 0x64, 0x05, 0x7A]);
		testArray = testArray.concat(testItemReadReg);

		testArray.forEach(function(element, index, array){
			var modbus = new Modbus();
			var _result = modbus.parseCmd(element["resultCmd"]);
			if(!_result["success"])
			{
				throw "parse the index of "+index+" Error.";
			}

			modbus.setStartRegAddress(element["startRegAddress"]);
			modbus.setRegCount(element["regCount"]);

			element["readData"].forEach(function(regItem, i){
				if((0x01 === modbus.getFunctionCode())
					||(0x02 === modbus.getFunctionCode()))
				{
					if(regItem["value"] !== modbus.getCoilValue(regItem["regAddress"])["result"])
					{
						throw "The test item of "+index+" 's coil value check "+i+" Error.";
					}
				}else
				{
					if(regItem["type"] === "rawData")
					{
						var _tmpObj = modbus.getRegValueForUint8Array(regItem["regAddress"], regItem["regCount"]);
						if(!utils.uint8ArrayCompare(regItem["value"], _tmpObj["result"]))
						{
							throw "The test item of "+index+" 's get register raw value error.";
						}
					}else if(regItem["type"] === "uint16")
					{
						var _tmpObj = modbus.getRegValueForUint16(regItem["regAddress"], regItem["littleEndian"]);
						if(!_tmpObj["success"]
							|| (regItem["value"] != _tmpObj["result"]))
						{
							throw "The test item of "+index+" 's get register uint16 value error.";
						}
					}else if(regItem["type"] === "int16")
					{
						var _tmpObj = modbus.getRegValueForInt16(regItem["regAddress"], regItem["littleEndian"]);
						if(!_tmpObj["success"]
							|| (regItem["value"] != _tmpObj["result"]))
						{
							throw "The test item of "+index+" 's get register int16 value error.";
						}
					}else if(regItem["type"] === "uint32")
					{
						var _tmpObj = modbus.getRegValueForUint32(regItem["regAddress"], regItem["littleEndian"]);
						if(!_tmpObj["success"]
							|| (regItem["value"] != _tmpObj["result"]))
						{
							throw "The test item of "+index+" 's get register uint32 value error.";
						}
					}else if(regItem["type"] === "int32")
					{
						var _tmpObj = modbus.getRegValueForInt32(regItem["regAddress"], regItem["littleEndian"]);
						if(!_tmpObj["success"]
							|| (regItem["value"] != _tmpObj["result"]))
						{
							throw "The test item of "+index+" 's get register int32 value error.";
						}
					}else if(regItem["type"] === "float")
					{
						var _tmpObj = modbus.getRegValueForFloat(regItem["regAddress"], regItem["littleEndian"]);
						if(!_tmpObj["success"]
							|| (regItem["value"] != _tmpObj["result"]))
						{
							throw "The test item of "+index+" 's get register float value error.";
						}
					}
				}
			});

		});
	}

	function modbusParseWriteTest()
	{
		var testArray = new Array();
		var testItemWriteOneCoil = {};
		testItemWriteOneCoil["meterNumber"] = 0x01;
		testItemWriteOneCoil["functionCode"] = 0x05;
		testItemWriteOneCoil["startRegAddress"] = 0xAC;
		testItemWriteOneCoil["writeData"] = true;
		testItemWriteOneCoil["resultCmd"] = new Uint8Array([0x01, 0x05, 0x00, 0xAC, 0xFF, 0x00, 0x4C, 0x1B]);
		testArray = testArray.concat(testItemWriteOneCoil);

		var testItemWriteOneReg = {};
		testItemWriteOneReg["meterNumber"] = 0x01;
		testItemWriteOneReg["functionCode"] = 0x06;
		testItemWriteOneReg["startRegAddress"] = 0x01;
		testItemWriteOneReg["writeData"] = 0x03;
		testItemWriteOneReg["writeDataType"] = "uint16"
		testItemWriteOneReg["resultCmd"] = new Uint8Array([0x01, 0x06, 0x00, 0x01, 0x00, 0x03, 0x98, 0x0B]);
		testArray = testArray.concat(testItemWriteOneReg);

		var testItemWriteServerCoil = {};
		testItemWriteServerCoil["meterNumber"] = 0x01;
		testItemWriteServerCoil["functionCode"] = 0x0F;
		testItemWriteServerCoil["startRegAddress"] = 0x13;
		testItemWriteServerCoil["regCount"] = 0x0A;
		testItemWriteServerCoil["resultCmd"] = new Uint8Array([0x01, 0x0F, 0x00, 0x13, 0x00, 0x0A, 0x24, 0x09]);
		testArray = testArray.concat(testItemWriteServerCoil);

		testArray.forEach(function(element, index, array){
			var modbus = new Modbus();
			var _result = modbus.parseCmd(element["resultCmd"]);
			if(!_result["success"])
			{
				throw "parse the index of "+index+" Error.";
			}
			
			if(modbus.getMeterNumber() !== element["meterNumber"])
			{
				throw "modbusParseWriteTest the index of "+index+" 's meterNumber error.";
			}

			if(modbus.getFunctionCode() !== element["functionCode"])
			{
				throw "modbusParseWriteTest the index of "+index+" 's functionCode error.";
			}

			if(modbus.getStartRegAddress() !== element["startRegAddress"])
			{
				throw "modbusParseWriteTest the index of "+index+" 's startRegAddress error.";
			}

			if(0x05 === modbus.getFunctionCode())
			{
				var _tmpObj = modbus.getCoilWriteValue();
				if(!_tmpObj.success || _tmpObj["result"] !== element["writeData"])
				{
					throw "modbusParseWriteTest the index of "+index+" 's coil write value error.";
				}
			}else if(0x06 === modbus.getFunctionCode())
			{
				if("rawData" === element["writeDataType"])
				{
					var _tmpObj = modbus.getRegWriteValueForUint8Array();
					if( !_tmpObj.success || !utils.uint8ArrayCompare(element["writeData"], _tmpObj.result))
					{
						throw "modbusParseWriteTest the index of "+index+" 's register write value error.";
					}
				}else if("uint16" === element["writeDataType"])
				{
					var _tmpObj = modbus.getRegWriteValueForUint16();
					if(!_tmpObj.success || _tmpObj["result"] !== element["writeData"])
					{
						throw "modbusParseWriteTest the index of "+index+" 's register write value error.";
					}
				}else if("int16" === element["writeDataType"])
				{
					var _tmpObj = modbus.getRegWriteValueForInt16();
					if(!_tmpObj.success || _tmpObj["result"] !== element["writeData"])
					{
						throw "modbusParseWriteTest the index of "+index+" 's register write value error.";
					}
				}
			}else
			{
				if(modbus.getRegCount() !== element["regCount"])
				{
					throw "modbusParseWriteTest the index of "+index+" 's register count error.";
				}
			}
		});
	} 

	function modbusParseTest()
	{
		var testArray = new Array();

		var testItemNotEnoughErro = {};
		testItemNotEnoughErro["data"] = new Uint8Array([0x01, 0x83, 0x01, 0x80]);
		testItemNotEnoughErro["startIndex"] = 0;
		testItemNotEnoughErro["len"] = 0;
		testItemNotEnoughErro["completed"] = false;
		testItemNotEnoughErro["success"] = false;
		testArray = testArray.concat(testItemNotEnoughErro);

		var testItemNotEnoughRead = {};
		testItemNotEnoughRead["data"] = new Uint8Array([0x01, 0x03, 0x06, 0x02, 0x2B, 0x00, 0x00, 0x12, 0x34, 0x09]);
		testItemNotEnoughRead["startIndex"] = 0;
		testItemNotEnoughRead["len"] = 0;
		testItemNotEnoughRead["completed"] = false;
		testItemNotEnoughRead["success"] = false;
		testArray = testArray.concat(testItemNotEnoughRead);

		var testItemNotEnoughWrite = {};
		testItemNotEnoughWrite["data"] = new Uint8Array([0x01, 0x05, 0x00, 0xAC, 0xFF, 0x00, 0x4C]);
		testItemNotEnoughWrite["startIndex"] = 0;
		testItemNotEnoughWrite["len"] = 0;
		testItemNotEnoughWrite["completed"] = false;
		testItemNotEnoughWrite["success"] = false;
		testArray = testArray.concat(testItemNotEnoughWrite);

		var testItemEnoughErro = {};
		testItemEnoughErro["data"] = new Uint8Array([0x01, 0x01, 0x83, 0x01, 0x80, 0xF0]);
		testItemEnoughErro["startIndex"] = 1;
		testItemEnoughErro["len"] = 5;
		testItemEnoughErro["completed"] = true;
		testItemEnoughErro["success"] = false;
		testArray = testArray.concat(testItemEnoughErro);

		var testItemErro = {};
		testItemErro["data"] = new Uint8Array([0x01, 0x01, 0x87, 0x01, 0x80, 0xF0]);
		testItemErro["startIndex"] = 0;
		testItemErro["len"] = 0;
		testItemErro["completed"] = false;
		testItemErro["success"] = false;
		testArray = testArray.concat(testItemErro);

		
		testArray.forEach(function(element, index, array){
			var modbus = new Modbus();
			var _result = modbus.parseCmd(element["data"]);

			if((_result.startIndex !== element["startIndex"])
				|| (_result.len !== element["len"])
				|| (_result.completed !== element["completed"])
				|| (_result.success !== element["success"]))
			{
				throw "parse index of "+index+" item error.";
			}
		});

	}

	$("#idModBusTest").click(function(){
		
		modbusReadTest();

		modbusWriteTest();

		modbusParseReadTest();

		modbusParseWriteTest();

		modbusParseTest();

		console.log("Modbus test passed.");
	});

	function gb645_1997ReadTest()
	{
		var gb645 = new GB645_1997();
		gb645.setMeterNumber("123456789");
		gb645.setDI(0x9010);
		gb645.setCtrlCode(0x01);

		var _result = new Uint8Array([0x68, 0x89, 0x67, 0x45, 0x23, 0x01, 0x00, 0x68, 0x01, 0x02, 0x43, 0xC3, 0x32, 0x16]);

		var _returnObj = gb645.getCmd();

		if(!utils.uint8ArrayCompare(_result, _returnObj.result))
		{
			throw "error";
		}
	}

	function HT_Encrypt(data, offset, len)
	{
		if(typeof(offset) == "undefined")
		{
			offset = 0;
		}

		if((typeof(len)==="undefined")
			|| ((offset+len)>data.length))
		{
			len = data.length - offset;
		}

		for(var i=0; i<len; i++)
	    {
	        if ((i + 1)%2 == 0)
	        {
	            data[offset + i] = (data[offset + i] + 0x87 + i) & 0xFF ;
	        }
	        else {
	            data[offset + i] = (data[offset + i] + 0x7b + i) & 0xFF ;
	        }
	    }
	}

	function HT_Decrypt(data, offset, len)
	{
		if(typeof(offset) == "undefined")
		{
			offset = 0;
		}

		if((typeof(len)==="undefined")
			|| ((offset+len)>data.length))
		{
			len = data.length - offset;
		}

		for(var i=0; i<len; i++)
	    {
	        if ((i + 1)%2 == 0)
	        {
	            data[offset + i] = (data[offset + i] - 0x87 - i) & 0xFF;
	        }
	        else
	        {
	            data[offset + i] = (data[offset + i] - 0x7b - i) & 0xFF;
	        }
	    }
	}

	function HT_YuFuFeiTest()
	{
		var gb645 = new GB645_1997();
		gb645.setEncryptFunction(HT_Encrypt);
		gb645.setDecryptFunction(HT_Decrypt);
		// gb645.setMeterNumber("823789");
		// gb645.setDataLen(5);
		// gb645.setDI(0xF062);

		//var _cmdData = new Uint8Array([0x68, 0x89, 0x37, 0x82, 0x00, 0x00, 0x00, 0x68, 0x04, 0x05, 0xdd, 0x78, 0xe2, 0xcd, 0xa0, 0xBF, 0x16]);
		var _cmdData = new Uint8Array([0x68, 0x89, 0x37, 0x82, 0x00, 0x00, 0x00, 0x68, 0x81, 0x0E, 0x69, 0x78, 0x7D, 0xDC, 0x7F, 0x8D, 0xD3, 0x8E, 0x85, 0xE2, 0x85, 0x95, 0xD9, 0x94, 0x36, 0x16]);

		var _returnObj = gb645.parseCmd(_cmdData);

		console.log(gb645.getMeterNumber());
		console.log(gb645.getDI());
		console.log(gb645.getDataForUint(2,3));
	}

	$("#idGB645_1997Test").click(function(){
		gb645_1997ReadTest();

		HT_YuFuFeiTest();
	});
});