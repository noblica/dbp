(function() {
    'use strict';
    
    angular.module('test', []);
})();
(function() {
    'use strict';
    
    angular.module('app', ['ui.router',
                            'ui.bootstrap',
                            'ngAnimate',
                            'core', 
                            'pipeline',
                           'test'])
        .config(routeConfiguration);
    
    routeConfiguration.$inject = ['$stateProvider', '$urlRouterProvider'];
    function routeConfiguration($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('app', {
                abstract: true,
                controller: 'AppController',
                controllerAs: 'app',
                template: '<ui-view></ui-view>'
            })
            .state('app.home', {
                url: '',
                controller: 'TestController',
                controllerAs: 'vm',
                templateUrl: 'app/TestModule/test.html'
            });
        
        $urlRouterProvider
            .when('', goHome)
            .when('/', goHome)
            .otherwise('/error/404');
        
        goHome.$inject = ['$state'];
        function goHome($state) {
            $state.go('app.home');
        }
    }
})();
(function() {
    'use strict';

    angular.module('core', []);
    
})();
(function() {
    'use strict';

    angular.module('pipeline', []);
    
})();
(function() {
    'use strict';

    angular.module('test')
        .controller('TestController', TestController);

    TestController.$inject = [];
    function TestController() {
        var vm = this;

        vm.corelationRegisterCollapse = false;
        vm.localHistoryCollapse = true;
        vm.predictionMachinesCollapse = true;

        vm.toggleLocalHistory = toggleLocalHistory;

        activate();

        function activate() {}

        function toggleLocalHistory(historyHandler) {
            vm.localHistoryCollapse = !vm.localHistoryCollapse;
            console.log(vm.localHistoryCollapse);
        }
    }
})();

(function() {
    'use strict';
    
    angular.module('app')
        .controller('AppController', AppController);
    
    AppController.$inject = [];
    function AppController() {
        var vm = this;
        
        activate();
        
        function activate() {
            console.log('Layout controller loaded!');    
        }
    }
})();
/**
 * A service that decodes the operation,
 * and actually executes it, and also sets the corresponding flags.
 */

(function() {
  'use strict';

  /*jshint bitwise: false*/
  /*jshint maxcomplexity: false*/
  angular.module('app')
    .factory('aluService', aluService);

  aluService.$inject = ['registerService'];
  function aluService(registerService) {
    var service = {
        flags: {
            ZF: false,
            CF: false,
            OF: false,
            SF: false
        },
        a: 0,
        aRegName: '',
        b: 0,
        bRegName: '',
        cmpResult: 0,
        maxValue: Math.pow(2, 16) - 1,
        maxValueSigned: Math.pow(2, 15) - 1,
        bitSize: 15,

        compareAndSetFlags: compareAndSetFlags

        // cmpResult values:
        // 0 - Previous comparison result is a = b
        // <0 - Previous comparison is a < b
        // >0 - Previous comparison is a > b
    };

    return service;

    /**
     * Helper function for setiting the maximum value allowed.
     * The value should be set in bits.
     */
    function setMaxValue(newBitValue) {
        service.maxValue = Math.pow(2, newBitValue) - 1;
        service.maxValueSigned = Math.pow(2, newBitValue - 1) - 1;
        return service.maxValue;
    }
    
    function setRegNamesAndValues(value1, value2) {
        
        // service.a = registerService.getValueOfReg(value1) || service.a;
        service.a = registerService.getValueOfReg(value1);
        service.b = Number(value2) !== undefined ? 
                    Number(value2) :
                    service.b;
        
        /**
         * If the second operator is not a number,
         * it can only be a name of a register.
         * So we fetch the value from that register, and use it from here on out.
         */
        if (isNaN(value2)) {
            service.bRegName = value2;
            service.b = registerService.getValueOfReg(value2);
        }
    }
    
    /**
     * Decodes the operation using switch-case,
     * assigns the parsed values to the service,
     * executes the operation, and sets the flags.
     */
    function compareAndSetFlags(newA, newB, operation) {
        
        /**
         * Get the values.
         * If they aren't being passed in, assign the previous values,
         * to the temporary variables
         */
        setRegNamesAndValues(newA, newB);

        var cmpResult = service.cmpResult;
        var aSign = getSign(service.a);
        var bSign = getSign(service.b);
        var cmpSign = null;

        switch (operation) {
            case 'mov':
                registerService.setValueOfReg(service.aRegName, service.b);
                cmpResult = service.b;
            break;

            case 'add':
                cmpResult = service.a + service.b;

                setCF(false);
                setOF(false);

                if (Math.abs(cmpResult) > service.maxValue) {
                    setCF(true);
                    cmpResult = truncateResult(cmpResult);
                }

                cmpSign = getSign(cmpResult);
                if (signChanged(aSign, bSign, cmpSign)) {
                        setOF(true);
                    }
                    
                registerService.setValueOfReg(service.aRegName, cmpResult);
            break;

            case 'sub':
            case 'cmp':
                setCF(false);
                setOF(false);
                setZF(false);
                
                cmpResult = truncateResult(service.a - service.b);
                                
                if (service.b > service.a) {
                    setCF(true);
                }

                if (service.b === service.a) {
                    setZF(true);
                }

                cmpSign = getSign(cmpResult);

                if (signChanged(aSign, bSign, cmpSign)) {
                    setOF(true);
                }
                
                registerService.setValueOfReg(service.aRegName, cmpResult);
            break;

            case 'mul':
                setCF(false);
                setOF(false);
                setZF(false);

                cmpResult = service.a * service.b;

                if (cmpResult === 0) {
                    setZF(true);
                }

                if (Math.abs(cmpResult) > service.maxValue) {
                    setCF(true);
                    cmpResult = truncateResult(cmpResult);
                }

                cmpSign = getSign(cmpResult);
                if (signChanged(aSign, bSign, cmpSign)) {
                        setOF(true);
                    }
            break;

            case 'div':
                setOF(false);
                
                cmpResult = service.a / service.b;

                if (cmpSign === Infinity) {
                        setOF(true);
                    }
            break;

            case 'and':                
                cmpResult = service.a & service.b;
                setSF(!!getSign(cmpResult));
                registerService.setValueOfReg(service.aRegName, cmpResult);
            break;

            case 'or':
                cmpResult = service.a | service.b;
                setSF(!!getSign(cmpResult));
                registerService.setValueOfReg(service.aRegName, cmpResult);
            break;

            case 'xor':
                cmpResult = service.a ^ service.b;
                setSF(!!getSign(cmpResult));
                registerService.setValueOfReg(service.aRegName, cmpResult);
            break;

            case 'test':
                setZF(false);
                setSF(false);
                
                cmpResult = service.a & service.b;
                
                if (cmpResult === 0) {
                    setZF(true);
                }
                
                setSF(!!getSign(cmpResult));
            break;

            case 'not':
                cmpResult = ~service.a;
                registerService.setValueOfReg(service.aRegName, cmpResult);
            break;
        }

        service.cmpResult = cmpResult;
        return service.cmpResult;
    }
    
    /**
     * A helper funtion for checking if the sign has changed.
     * Useful if called after the operation was executed.
     * It needs both operator signs, and the result sign.
     */
    function signChanged(aSign, bSign, cmpSign) {
        return ((aSign === bSign) &&
                (cmpSign !== aSign));
    }

    /**
     * A helper function for fetching the sign of a passed in number.
     * The number is truncated (just in case),
     * converted to it's binary form,
     * split, so that each number is an element in an array,
     * reversed (because fetching the [0] element of the array doesn't always represent it's sign),
     * and it's last bit is fetched (which, when it's reversed, represents the number)
     * 
     * The value will be 0 if the number is > 0, or 1 if the number is < 0.
     */
    function getSign(number) {
        var bitSize = service.bitSize;
        var truncatedValue = truncateResult(number);
        var bitValue = truncatedValue.toString(2);
        var sign = Number(bitValue.split('').reverse()[bitSize]);

        return sign ? sign : 0;
    }
    
    /**
     * A function that returns truncated value of the number passed in.
     */
    function truncateResult(result) {
        return Number(result) & service.maxValue;
    }

    // Function for setting the zero flag
    function setZF(newZFValue) {
        service.flags.ZF = newZFValue === undefined ?
                        (service.cmpResult === 0) :
                        newZFValue;
        return service.flags;
    }

    // Function for setting the carry flag
    function setCF(newCFValue) {
        service.flags.CF = newCFValue === undefined ?
                        service.flags.CF :
                        newCFValue;
        return service.flags;
    }

    // Function for setting the overflow flag
    function setOF(newOFValue) {
        service.flags.OF = newOFValue;

        if (newOFValue === undefined) {
            service.flags.OF = newOFValue === undefined ? 
                                service.flags.OF :
                                newOFValue;
        }
        return service.flags;
    }

    // Sign/Negative flag
    function setSF(newSFValue) {
        service.flags.SF = newSFValue ||
                        (service.cmpResult < 0) ||
                        (service.cmpResult > service.maxValue);
        return service.flags;
    }
  }
})();

(function() {
  'use strict';

  angular.module('app')
    .controller('CodeInputController', CodeInputController);

    // jshint maxparams:13

  CodeInputController.$inject = ['IFService',
                                  'IFModel',
                                'IDService',
                                'IDModel',
                                'EXService',
                                'EXModel',
                                'WBService',
                                'WBModel',
                                'labelService',
                                'pcService',
                                'common',
                                '$interval'];

  function CodeInputController(IFService,
                              IFModel,
                              IDService,
                              IDModel,
                              EXService,
                              EXModel,
                              WBService,
                              WBModel,
                              labelService,
                              pcService,
                              common,
                              $interval) {
    var vm = this;
                            
    vm.codeInput = 'mov ax, 0\nmov bx, 2\nl1:\nadd ax, 1\ncmp ax, bx\njl l1\nend';
    vm.stepByStep = false;
    vm.codeArray = [];
    vm.pipelineStarted = false;

    vm.IFModel = IFModel;
    vm.IDModel = IDModel;
    vm.EXModel = EXModel;
    vm.WBModel = WBModel;
    vm.common = common;

    vm.doPrediction = doPrediction;
    vm.goToNextBranchInstruction = goToNextBranchInstruction;

    function doPrediction(codeInput) {
      var codeSplitByLine = codeInput.split('\n');
      var codeArray = removeJustNewlines(codeSplitByLine);
      vm.codeArray = labelService.setAndRemoveLabelsFromCodeArray(codeArray);

      vm.pipelineStarted = true;
      
      // Initial PC value (not yet started)
      pcService.pc = -1;

      if (vm.stepByStep){
        pcService.setNewPc();
        parseAll(pcService.pc, vm.codeArray);
      } else {
        setIterationInterval(vm.codeArray);
      }
    }

    function goToNextBranchInstruction(codeArray) {

      if (isLastInstructionInWb(codeArray)) {
          common.flushPipeline();
          common.flushPipeline(false, false, false, true);
          vm.pipelineStarted = false;
        } else {
          iterateThePipeline(pcService.pc, codeArray);
        }
    }

    function setIterationInterval(codeArray) {
      var pipelineInterval = $interval(function() {
        
        if (isLastInstructionInWb(codeArray)) {
          $interval.cancel(pipelineInterval);
          common.flushPipeline();
          common.flushPipeline(false, false, false, true);
          vm.pipelineStarted = false;
        } else {
          iterateThePipeline(pcService.pc, codeArray);
        }
      }, 10);
    }
    
    function isLastInstructionInWb(codeArray) {
      // return (pcService.pc > WBModel.currentPc) && 
      //         (WBModel.currentPc >= codeArray.length);
      return WBModel.instructionsInWB.some(function(instructionObj) {
          return instructionObj.operation === 'end';
      });
    }
      
    function removeJustNewlines(arrayWithNewlines) {
      var arrayWithoutNewlines = arrayWithNewlines.filter(function(value) {
        return value !== '';
      });
      
      return arrayWithoutNewlines; 
    }
    
    function iterateThePipeline(pc, codeArray, howMany) {

      pipeThroughAll()
        .then(function() {
          pcService.setNewPc();
          var parsePromise = parseAll(pcService.pc, codeArray, howMany);
          return parsePromise;
      });
    }

    function parseAll(pc, codeArray, howMany) {
      return IFService.parse(pc, codeArray, 1)
          .then(IDService.parse)
          .then(EXService.parse)
          .then(WBService.parse)
          .then(function(response) {
            console.log(response);
          });
    }

    function pipeThroughAll() {
      return WBService.pipeThrough()
          .then(EXService.pipeThrough)
          .then(IDService.pipeThrough)
          .then(IFService.pipeThrough);
    }

  }
})();


// Following are the conditional jump instructions used on signed data used for arithmetic operations −
//
// Instruction	Description	Flags tested
// JE/JZ	Jump Equal or Jump Zero	ZF
// JNE/JNZ	Jump not Equal or Jump Not Zero	ZF
// JG/JNLE	Jump Greater or Jump Not Less/Equal	OF, SF, ZF
// JGE/JNL	Jump Greater/Equal or Jump Not Less	OF, SF
// JL/JNGE	Jump Less or Jump Not Greater/Equal	OF, SF
// JLE/JNG	Jump Less/Equal or Jump Not Greater	OF, SF, ZF
// Following are the conditional jump instructions used on unsigned data used for logical operations −
//
// Instruction	Description	Flags tested
// JE/JZ	Jump Equal or Jump Zero	ZF
// JNE/JNZ	Jump not Equal or Jump Not Zero	ZF
// JA/JNBE	Jump Above or Jump Not Below/Equal	CF, ZF
// JAE/JNB	Jump Above/Equal or Jump Not Below	CF
// JB/JNAE	Jump Below or Jump Not Above/Equal	CF
// JBE/JNA	Jump Below/Equal or Jump Not Above	AF, CF
// The following conditional jump instructions have special uses and check the value of flags −
//
// Instruction	Description	Flags tested
// JXCZ	Jump if CX is Zero	none
// JC	Jump If Carry	CF
// JNC	Jump If No Carry	CF
// JO	Jump If Overflow	OF
// JNO	Jump If No Overflow	OF
// JP/JPE	Jump Parity or Jump Parity Even	PF
// JNP/JPO	Jump No Parity or Jump Parity Odd	PF
// JS	Jump Sign (negative value)	SF
// JNS	Jump No Sign (positive value)	SF
// The syntax for the J<condition> set of instructions −
//
// Example,
//
// CMP	AL, BL
// JE	EQUAL
// CMP	AL, BH
// JE	EQUAL
// CMP	AL, CL
// JE	EQUAL
// NON_EQUAL: ...
// EQUAL: ...

;(function() {
  'use strict';

  angular.module('app')
    .directive('codeInput', codeInput);

  codeInput.$inject = [];
  function codeInput() {
    var directive = {
      restrict: 'E',
      controller: 'CodeInputController',
      controllerAs: 'ci',
      templateUrl: 'app/codeInput/code-input.html'
    };

    return directive;
  }
})();

(function() {
    'use strict';

    angular.module('core')
        .factory('common', common);

    common.$inject = ['IFModel', 
                      'IDModel',
                      'EXModel',
                      'WBModel'];
                      
    function common(IFModel, 
                       IDModel,
                       EXModel,
                       WBModel) {
                           
        var service = {
            flushPipeline: flushPipeline,
            instructionToText: instructionToText
        };

        return service;
        
        function flushPipeline(flushIf, flushId, flushEx, flushWb) {
      
            if (flushIf === undefined) {
                IFModel.flush();
                IDModel.flush();
                EXModel.flush();
            } else {
            
                if (flushIf) {
                    IFModel.flush();
                }
                
                if (flushId) {
                    IDModel.flush();
                }
                
                if (flushEx) {
                    EXModel.flush();
                }
                
                if (flushWb) {
                    WBModel.flush();
                }
            }
        }

        function instructionToText(instructionObject) {
            var firstOperatorExists = instructionObject.firstOperator !== (undefined || null);
            var secondOperatorExists = instructionObject.secondOperator !== (undefined || null); 

            return instructionObject.operation + ' ' +
            (firstOperatorExists ?
             instructionObject.firstOperator :
             '') +
             (secondOperatorExists ? 
             (', ' + instructionObject.secondOperator) :
             (''));
        }
    }
})();
(function() {
    'use strict';
    
  /*jshint maxcomplexity: false*/
    angular.module('core')
        .factory('jmpInstructionService', jmpInstructionService);

    jmpInstructionService  .$inject = ['aluService'];
    function jmpInstructionService (aluService) {
        var service = {
            jmpInstructions: [],
            isJmpInstruction: isJmpInstruction,
            checkBranchCondition: checkBranchCondition
        };
        
        activate();

        return service;
        
        function activate() {
            service.jmpInstructions = ['jmp', 'je', 'jz', 'jne',
                                        'jnz', 'jg', 'jnle', 'jge',
                                        'jnl', 'jl', 'jnge', 'jle',
                                        'jng'];
        }
        
        function isJmpInstruction(operation) {
            return service.jmpInstructions.indexOf(operation) !== -1;
        }
        
        function checkBranchCondition(operation) {
            var aluFlags = aluService.flags;
            
            switch(operation) {
                case 'jmp': 
                return true;
                
                case 'je':
                case 'jz':
                return aluFlags.ZF;
                
                case 'jne':
                case 'jnz':
                return !aluFlags.ZF;
                
                case 'jg':
                case 'jnle':
                return (!aluFlags.ZF && (aluFlags.SF === aluFlags.OF));
                
                case 'jge':
                case 'jnl':
                return aluFlags.SF === aluFlags.OF;
                
                case 'jl':
                case 'jnge':
                return (aluFlags.SF !== aluFlags.OF);
                
                case 'jle':
                case 'jng':
                return (aluFlags.ZF) || (aluFlags.SF !== aluFlags.OF);
            }
        }
    }
})();

(function() {
    'use strict';

    angular.module('core')
        .factory('labelService', labelService);

    labelService.$inject = [];
    function labelService() {
        var service = {
            labelArray: [],
            
            getAddress: getAddress,
            setLabelAddress: setLabelAddress,
            setAndRemoveLabelsFromCodeArray: setAndRemoveLabelsFromCodeArray
        };

        return service;
        
        function setLabelAddress(label, address) {
            var objectToPush = {};
            objectToPush[label.toLowerCase()] = address;
            service.labelArray.push(objectToPush);
        }
        
        function getAddress(label) {
            var labelObjectToReturn = null;
                        
            service.labelArray.some(function(labelObject) {
                if (labelObject[label] !== undefined) {
                    labelObjectToReturn = labelObject;
                    return true;
                }
            });
            
            return labelObjectToReturn[label];
        }
        
        function setAndRemoveLabelsFromCodeArray(codeArray) {
            var codeArrayToReturn = codeArray;
            var index = 0;
            
            while (index < codeArray.length){
                var codeString = codeArray[index];
                
                if (codeString.indexOf(':') !== -1) {
                    var label = codeString.slice(0, codeString.indexOf(':'));
                    
                    codeArrayToReturn.splice(index, 1);
                    setLabelAddress(label, index);
                }
                else {
                    index++;
                }
            }            
            return codeArrayToReturn;
        }
    }
})();
(function() {
    'use strict';

    angular.module('core')
        .factory('pcService', pcService);

    pcService.$inject = [];
    function pcService() {
        var service = {
            pc: -1,
            branchesPredictedTaken: [],
            overridePc: null,

            setNewPc: setNewPc
        };

        return service;

        function setNewPc() {

            service.pc += 1;
            if (service.overridePc !== null) {
                service.pc = service.overridePc;
                service.overridePc = null;
            }
        }
    }
})();

(function() {
    'use strict';

    angular.module('core')
        .factory('EXModel', EXModel);

    EXModel.$inject = [];
    function EXModel() {
        var service = {
            currentPc: null,
            returnPromise: null,
            nextPredictionFalse: false,
            instructionsInEX: [],
            writeBackResults: [],

            flush: flush
        };

        return service;

        function flush() {
            service.currentPc = 0;
            service.instructionsInEX = [];
            service.writeBackResults = [];
            var objectToResolve = {
                currentPc: service.currentPc,
                instructionSet: service.instructionsInEX,
                writeBackResults: service.writeBackResults
            };

            // Resolving, so that the pipeline doesn't stall,
            // even though we're flushing.
            service.returnPromise.resolve(objectToResolve);
        }
    }
})();

(function() {
    'use strict';

    angular.module('core')
        .factory('EXService', EXService);

    EXService.$inject = ['$q', 
                         'aluService',
                         'jmpInstructionService',
                         'labelService',
                         'pcService',
                         'EXModel',
                         'common',
                         'predictionMachinesService'];
    function EXService($q, 
                       aluService,
                       jmpInstructionService,
                       labelService,
                       pcService,
                       EXModel,
                       common,
                       predictionMachinesService) {
        var service = {
            parse: parse,
            pipeThrough: pipeThrough,
            parseJumpInstruction: parseJumpInstruction
        };

        return service;
        
        function parse(objectFromId) {
            EXModel.currentPc = objectFromId.currentPc;
            EXModel.instructionsInEX = objectFromId.instructionSet;
            EXModel.writeBackResults = [];
            
            decodeInstructions(EXModel.instructionsInEX);
            EXModel.returnPromise = $q.defer();
            
            return EXModel.returnPromise.promise;
        }
        
        function parseJumpInstruction(instruction, index) {
            var branchTaken = jmpInstructionService.checkBranchCondition(instruction.operation);
            var labelAddress = labelService.getAddress(instruction.firstOperator);
            var currentOperationPc = EXModel.currentPc + index;
            var branchPredictedIndex = pcService.branchesPredictedTaken.indexOf(currentOperationPc);

            if (EXModel.nextPredictionFalse) {
                branchTaken = !branchTaken;
            }

            // If branch should be taken, and it was predicted not taken 
            if (branchTaken &&
                branchPredictedIndex === -1) {
                // Flush instructions in IF and ID
                common.flushPipeline(true, true);

                // Set new PC
                // pcService.pc = labelAddress;
                pcService.overridePc = labelAddress;
                
                // Update predictions
                predictionMachinesService.updatePredictions(1);

                // The execution loop needs to be broken 
                return true;
            }
            
            // If branch should be taken, and it was predicted taken 
            else if (branchTaken &&
                        branchPredictedIndex !== -1) {

                // Remove the prediction from the list of predicted taken
                pcService.branchesPredictedTaken.splice(branchPredictedIndex, 1);

                // Update predictions
                predictionMachinesService.updatePredictions(1);
            } 

            // If branch should not be taken, and it was predicted not taken 
            else if (!branchTaken &&
                        branchPredictedIndex === -1) {

                // Update predictions
                predictionMachinesService.updatePredictions(0);
            } 

            // If branch should not be taken, and it was predicted taken 
            else if (!branchTaken && 
                        branchPredictedIndex !== -1) {

                // Flush instructions in IF and ID
                common.flushPipeline(true, true);

                // Set new PC
                // pcService.pc = currentOperationPc + 1;
                pcService.overridePc = currentOperationPc + 1;
                
                // Remove the prediction from the list of predicted taken
                pcService.branchesPredictedTaken.splice(branchPredictedIndex, 1);

                // Update predictions
                predictionMachinesService.updatePredictions(0);

                // The execution loop needs to be broken 
                return true;
            }

            // The execution loop should not be broken
            return false;
        }
        
        function parseALUInstruction(instruction) {
            EXModel.writeBackResults = executeInstructions(instruction);
        }
        
        function decodeInstructions(instructionsToDecode) {
            
            instructionsToDecode.some(function(operationObject, index) {
                var operationFromId = operationObject.operation;
                var isJmpInstruction = jmpInstructionService.isJmpInstruction(operationFromId);
                
                if (isJmpInstruction) {
                    var jmpTaken = parseJumpInstruction(operationObject, index);
                    return jmpTaken;
                } else {
                    parseALUInstruction(operationObject);
                }
            });
            return EXModel.instructionsInEX;
        }
        
        function pipeThrough() {
            if (EXModel.returnPromise) {
                var objectToPipe = {
                    currentPc: EXModel.currentPc,
                    instructionSet: EXModel.instructionsInEX,
                    writeBackResults: EXModel.writeBackResults
                };
                
                EXModel.returnPromise.resolve(objectToPipe);
                return EXModel.returnPromise.promise;
            }
            
            return $q.resolve();
        }
        
        function executeInstructions(instruction) {
            var firstOperator = instruction.firstOperator;
            var secondOperator = instruction.secondOperator;
            var operation = instruction.operation;
            
            var result = aluService.compareAndSetFlags(firstOperator, secondOperator, operation); 
            var writeBackObject = {
                currentPc: EXModel.currentPc,
                register: instruction.firstOperator,
                result: result,
                operation: operation
            };
            EXModel.writeBackResults.push(writeBackObject);

            return EXModel.writeBackResults;
        }
    }
})();
(function() {
    'use strict';

    angular.module('core')
        .factory('IDModel', IDModel);

    IDModel.$inject = [];
    function IDModel() {
        var service = {
            currentPc: null,
            returnPromise: null,
            instructionsInID: [],
            flush: flush
        };

        return service;

        function flush() {
            service.currentPc = 0;
            service.instructionsInID = [];
            var objectToResolve = {
                currentPc: service.currentPc,
                instructionSet: service.instructionsInID
            };

            // Resolving, so that the pipeline doesn't stall,
            // even though we're flushing.
            service.returnPromise.resolve(objectToResolve);
        }
    }
})();

(function() {
    'use strict';

    angular.module('core')
        .factory('IDService', IDService);

    IDService.$inject = ['$q', 'IDModel'];
    function IDService($q, IDModel) {
        var service = {
            parse: parse,
            pipeThrough: pipeThrough,
            decodeSingleInstruction: decodeSingleInstruction
        };

        return service;
        
        function parse(objectFromIf) {
            IDModel.currentPc = objectFromIf.currentPc;
            IDModel.instructionsInID = decodeInstructions(objectFromIf.instructionSet);
            IDModel.returnPromise = $q.defer();
            
            return IDModel.returnPromise.promise;
        }
        
        function pipeThrough() {
            if (IDModel.returnPromise) {
            
                var objectToPipe = {
                    currentPc: IDModel.currentPc,
                    instructionSet: IDModel.instructionsInID
                };
                
                IDModel.returnPromise.resolve(objectToPipe);
                return IDModel.returnPromise.promise;
            }
            
            return $q.resolve();
        }

        function decodeSingleInstruction(line) {
            var removedCommaFromline = line.replace(',', '');
                var splitBySpace = removedCommaFromline.split(' ');
                
                var decodedInstruction = {
                    operation: splitBySpace[0].toLowerCase(),
                    firstOperator: splitBySpace[1] === undefined ? 
                                                        null : 
                                                        splitBySpace[1].toLowerCase(),
                    secondOperator: splitBySpace[2] === undefined ? 
                                                        null : 
                                                        splitBySpace[2].toLowerCase() 
                };

            return decodedInstruction;
        }
        
        function decodeInstructions(instructionsToDecode) {
            var decodedInstructions = [];
            
            instructionsToDecode.forEach(function(line) {                
                var newInstruction = decodeSingleInstruction(line);
                
                decodedInstructions.push(newInstruction);
            });
            return decodedInstructions;
        }
    }
})();

(function() {
    'use strict';

    angular.module('core')
        .factory('IFModel', IFModel);

    IFModel.$inject = [];
    function IFModel() {
        var service = {
            currentPc: null,
            returnPromise: null,
            instructionsInIF: [],

            flush: flush
        };

        return service;

        function flush() {
            service.currentPc = 0;
            service.instructionsInIF = [];
            var objectToResolve = {
                currentPc: service.currentPc,
                instructionSet: service.instructionsInIF  
            };

            // Resolving, so that the pipeline doesn't stall,
            // even though we're flushing.
            service.returnPromise.resolve(objectToResolve);
        }
    }
})();

(function() {
    'use strict';

    angular.module('core')
        .factory('IFService', IFService);

    IFService.$inject = ['$q', 
                        'IFModel',
                        'IDService',
                        'jmpInstructionService',
                        'labelService',
                        'pcService',
                        'predictionMachinesService'];
    function IFService($q,
                        IFModel,
                        IDService,
                        jmpInstructionService,
                        labelService,
                        pcService,
                        predictionMachinesService) {
        var service = {
            currentPc: null,
            returnPromise: null,
            instructionsInIF: [],
            codeArrayInput: [],

            parse: parse,
            pipeThrough: pipeThrough
        };

        return service;
        
        /**
         * Parses the instruction array, gets the required number of instructions 
         * (if nothing is passed, then it is presumed that the number of instructions is 1)
         * from the instruction array.
         * 
         * Returns a promise, which will be resolved when 'pipeThrough' is called.
         */
        function parse(currentPc, instructionArray, howManyInstructionsToPipe) {
            IFModel.currentPc = currentPc || 0;
            howManyInstructionsToPipe = howManyInstructionsToPipe || 1;
            IFModel.returnPromise = $q.defer();
            var sliceFrom = IFModel.currentPc;
            var sliceTo = IFModel.currentPc + howManyInstructionsToPipe;
            service.codeArrayInput = angular.copy(instructionArray);

            var slicedInstructions = instructionArray.slice(sliceFrom, sliceTo);

            checkForBranchInstructions(slicedInstructions);
            IFModel.instructionsInIF = slicedInstructions;
            return IFModel.returnPromise.promise;
        }

        function checkForBranchInstructions(instructionArray) {
            var i = 0;

            while (i < instructionArray.length) {
                var currentLine = instructionArray[i];
                var decodedInstruction = IDService.decodeSingleInstruction(currentLine);
                // var instructionPc = i + pcService.pc;
                var instructionPc = i + IFModel.currentPc;

                var isJmpInstruction = jmpInstructionService.isJmpInstruction(decodedInstruction.operation);

                if (isJmpInstruction && 
                    predictionMachinesService.getCurrentPrediction()) {
                    var numOfInstructions = instructionArray.length - i - 1;
                    var predictedAddress = getPredictedAddress(decodedInstruction);
                    if (numOfInstructions > 0) {
                    
                        // We need to replace the instructions that are after the jump instruction
                        // with the instructions that are predicted.
                        var predictedValues = getPredictedValues(predictedAddress, numOfInstructions);

                        // Append new instructions, to the array of instructions,
                        // that will be passed to IDService.
                        instructionArray.splice(i, numOfInstructions);
                        instructionArray.concat(predictedValues);
                    }

                    /** Adding the predicted instruction
                     *  to the array of predicted instructions.
                     *  It will be used later, when the instruction executes
                     */
                    pcService.branchesPredictedTaken.push(instructionPc);

                    // Setting the next PC.
                    // pcService.pc = predictedAddress + numOfInstructions;
                    pcService.overridePc = predictedAddress + numOfInstructions;

                }
                i++;
            }

            return instructionArray;
        }

        function getPredictedValues(labelAddress, num) {
            var sliceToAddress = labelAddress + num;
            
            return service.codeArrayInput.slice(labelAddress, sliceToAddress);        
        }

        function getPredictedAddress(instructionObj) {
            var label = instructionObj.firstOperator;
            return labelService.getAddress(label);
        }
        
        /**
         * Resolves the promise with the required number of instructions
         */        
        function pipeThrough() {
            if (IFModel.returnPromise) {
                var objectToPipe = {
                    currentPc: IFModel.currentPc,
                    instructionSet: IFModel.instructionsInIF  
                };
                IFModel.returnPromise.resolve(objectToPipe);
                return IFModel.returnPromise.promise;
            }
            return $q.resolve();
        }
    }
})();

(function() {
    'use strict';

    angular.module('core')
        .factory('WBModel', WBModel);

    WBModel.$inject = [];
    function WBModel() {
        var service = {
            currentPc: null,
            returnPromise: null,
            instructionsInWB: [],
            writeBackResults: [],

            flush: flush
        };

        return service;
        
        function flush() {
            service.currentPc = 0;
            service.instructionsInWB = [];
            service.writeBackResults = [];
            service.returnPromise.resolve();            
        }
    }
})();

(function() {
    'use strict';

    angular.module('core')
        .factory('WBService', WBService);

    WBService.$inject = ['registerService', '$q', 'WBModel'];
    function WBService(registerService, $q, WBModel) {
        var dontWriteBack = ['cmp'];

        var service = {
            parse: parse,
            pipeThrough: pipeThrough
        };

        return service;
       
       function parse(objectFromEx) {
           WBModel.currentPc = objectFromEx.currentPc;
           WBModel.instructionsInWB = objectFromEx.instructionSet;
           WBModel.writeBackResults = objectFromEx.writeBackResults;
           writeBack(objectFromEx.writeBackResults);
           WBModel.returnPromise = $q.defer();
           
           return WBModel.returnPromise.promise;
       }
       
        function writeBack(writeBackSet) {
            writeBackSet.forEach(function(writeBackObject) {
                var dst = writeBackObject.register;
                var value = writeBackObject.result;
                var op = writeBackObject.operation;
                
                if (shouldWriteBack(op)) {
                    registerService.setValueOfReg(dst, value);
                }
            });
        }

        function shouldWriteBack(operation){
            
            /** If the operation is not in the dontWriteBack array
             *  we shouldn't preform a WB operation on the first operator.
             */
            return dontWriteBack.indexOf(operation) === -1;
        }
        
        function pipeThrough() {
           if (WBModel.returnPromise) { 
                WBModel.returnPromise.resolve(WBModel.writeBackResults);
                return WBModel.returnPromise.promise;
            }
            
            return $q.resolve();
        }
    }
})();
(function () {
    'use strict';

    angular.module('core')
        .factory('registerService', registerService);

    registerService.$inject = [];
    function registerService() {
        var service = {
            coreRegisters: {
                ax: 0,
                bx: 0,
                cx: 0,
                dx: 0,
                sp: 0,
                bp: 0,
                si: 0,
                di: 0   
            },
            otherRegisters: {},
            
            getValueOfReg: getValueOfReg,
            setValueOfReg: setValueOfReg
        };

        return service;

        function getValueOfReg(regName) {
            var regValue = 0;

            if (service.coreRegisters[regName] !== undefined) {
                regValue = service.coreRegisters[regName];

            } else if (service.otherRegisters[regName] !== undefined) {
                regValue = service.otherRegisters[regName];
            } else {
                service.otherRegisters[regName] = 0;
            }

            return regValue;
        }

        function setValueOfReg(regName, regValue) {

            if (service.coreRegisters[regName] !== undefined) {
                service.coreRegisters[regName] = regValue;
            } else {
                service.otherRegisters[regName] = regValue;
            }
            
            return regName;
        }
    }
})();
(function() {
	'use strict';

	angular.module('app')
			.controller('CorelationRegisterController', CorelationRegisterController);

	CorelationRegisterController.$inject = ['corelationRegisterService',
	'localHistoryTableService',
	'predictionMachinesService'];
	function CorelationRegisterController(corelationRegisterService,
		localHistoryTableService,
		predictionMachinesService) {

		var vm = this;

		vm.corelationRegister = corelationRegisterService;
		vm.locationHistoryTable = localHistoryTableService;
		vm.predictionMachines = predictionMachinesService;

		vm.updateValues = updateValues;

		activate();

		function activate() {
			// vm.corelationRegister.setMaxNumberOfBits(service.size);
			vm.corelationRegister.initializeCR();
		}

		function updateValues() {
			vm.corelationRegister.setMaxNumberOfBits(vm.corelationRegister.size);
			vm.locationHistoryTable.initializeLHT();
			vm.predictionMachines.setMachineSize();
		}
	}
})();

(function() {
	'use strict';

	angular.module('app')
			.directive('corelationRegister', corelationRegister);

	corelationRegister.$inject = [];
	function corelationRegister() {
		var directive = {
			restrict: 'E',
			controller: 'CorelationRegisterController',
			controllerAs: 'corReg',
			templateUrl: 'app/corelationRegister/corelation-register.html'
		};

		return directive;
	}
})();


(function() {
	'use strict';

	angular.module('app')
		.factory('corelationRegisterService', corelationRegisterService);

  	corelationRegisterService.$inject = [];
  	function corelationRegisterService() {
    	var service = {
    		value: [],
			size: 3,

    		setMaxNumberOfBits: setMaxNumberOfBits,
    		shiftWithValue: shiftWithValue,
			getRegisterValue: getRegisterValue,
			initializeCR: initializeCR
    	};

    	return service;

		function initializeCR(newCRSize) {
			var sizeOfCR = newCRSize || service.size;

			setMaxNumberOfBits(sizeOfCR);
		}

    	function setMaxNumberOfBits(numberOfBits) {
			service.value = [];

            for (var i = 0; i < numberOfBits; i++) {
                service.value[i] = 0;
            }
    	}

        function shiftWithValue(newValue) {
            service.value.shift();
            service.value.push(newValue);
        }

		function getRegisterValue() {
			var stringBinaryNumber = service.value.join('');
			return parseInt(stringBinaryNumber, 2);
		}
  	}
})();

(function() {
  angular.module('app')
    .controller('localHistoryTableController', localHistoryTableController);

  localHistoryTableController.$inject = ['localHistoryTableService',
                                        'predictionMachinesService'];
  function localHistoryTableController(localHistoryTableService,
                                        predictionMachinesService) {
    var vm = this;

    vm.localHistoryTable = localHistoryTableService;
    vm.predictionMachines = predictionMachinesService;
    vm.updateValues = updateValues;

    activate();

    function activate() {
        vm.localHistoryTable.initializeLHT();
    }

    function updateValues() {
        vm.localHistoryTable.initializeLHT();
        vm.predictionMachines.setMachineSize();
    }
  }
})();

(function() {
	'use strict';

	angular.module('app')
			.directive('localHistoryTable', localHistoryTable);

	localHistoryTable.$inject = [];
	function localHistoryTable() {
		var directive = {
			restrict: 'E',
			controller: 'localHistoryTableController',
			controllerAs: 'lht',
			templateUrl: 'app/localHistoryTable/local-history-table.html'
		};

		return directive;
	}
})();

(function() {
	'use strict';

	angular.module('app')
	.factory('localHistoryTableService', localHistoryTableService);

	localHistoryTableService.$inject = ['corelationRegisterService'];
  	function localHistoryTableService(corelationRegisterService) {
    	var service = {
    		value: [],
			size: 3,

    		setMaxNumberOfBits: setMaxNumberOfBits,
    		shiftWithValue: shiftWithValue,
			getLocalHistoryValue: getLocalHistoryValue,
			initializeLHT: initializeLHT
    	};

		activate();

    	return service;

		function activate() {}

		function initializeLHT(sizeOfRegister) {
			var initialSize = sizeOfRegister || service.size;
			service.value = [];

			setMaxNumberOfBits(initialSize);
		}

		function setMaxNumberOfRegisters(numberOfLHTRegisters) {
			var i = 0;

			while (i < numberOfLHTRegisters) {
				service.value[i++] = [];
			}
		}

    	function setMaxNumberOfBits(numberOfBits) {
			var numOfRegisters = Math.pow(2, corelationRegisterService.size);

			setMaxNumberOfRegisters(numOfRegisters);

    		service.value = service.value.map(function(value) {
    			for (var i = 0; i < numberOfBits; i++) {
    				value[i] = 0;
    			}
    			return value;
    		});
    	}

        function shiftWithValue(index, newValue) {
            service.value[index].shift();
            service.value[index].push(newValue);
        }

		function getLocalHistoryValue(index) {
			var lhStringValue = service.value[index].join('');
			var lhValue = parseInt(lhStringValue, 2);
			return lhValue;
		}
  	}
})();

(function() {
    'use strict';

  angular.module('app')
    .controller('PredictionMachinesController', PredictionMachinesController);

  PredictionMachinesController.$inject = ['predictionMachinesService',
                                        'corelationRegisterService',
                                        'localHistoryTableService'];
  function PredictionMachinesController(predictionMachinesService,
                                        corelationRegisterService,
                                        localHistoryTableService) {
    var vm = this;

    vm.numberOfMachines = predictionMachinesService.numOfMachines;
    vm.predictionMachines = predictionMachinesService;

    activate();

    function activate() {
        vm.predictionMachines.setMachineSize();
    }
  }
})();

(function() {
  angular.module('app')
    .directive('predictionMachines', predictionMachines);

  predictionMachines.$inject = [];
  function predictionMachines() {
    var directive = {
      restrict : 'E',
      controller: 'PredictionMachinesController',
      controllerAs: 'pm',
      templateUrl: 'app/predictionMachines/prediction-machines.html'
    };

    return directive;
  }
})();

(function() {
    'use strict';

  angular.module('app')
    .factory('predictionMachinesService', predictionMachinesService);

  predictionMachinesService.$inject = ['corelationRegisterService',
                                        'localHistoryTableService'];
  function predictionMachinesService(corelationRegisterService,
                                    localHistoryTableService) {
      var service = {
          numOfMachines: null,
          sizeOfMachines: 2,
          value: [],

          setMachineSize: setMachineSize,
          getCurrentPrediction: getCurrentPrediction,
          updatePredictions: updatePredictions
      };

      return service;

      function setMachineSize(size1, size2) {
          size1 = size1 || corelationRegisterService.size;
          size2 = size2 || localHistoryTableService.size;

          service.numOfMachines = Math.pow(2, size1 + size2);
          service.value = [];

          var i = 0;
          while (i < service.numOfMachines) {
              service.value[i++] = [1, 0];
          }
      }

      function updateMachine(machineIndex, value) {
          var machineValue = parseInt(service.value[machineIndex].join(''), 2);
          var maxValue = Math.pow(2, 2) - 1;

          if (value === 0 && 
            machineValue > 0) {
              machineValue -= 1;
          } else if (value === 1 &&
                    machineValue < maxValue){
              machineValue += 1;
          }

          var binaryValue = machineValue.toString(2);
          service.value[machineIndex] = padWithZeroes(binaryValue, service.sizeOfMachines).split('');

          return service.value;
      }

      function getCurrentPrediction() {
          var localHistoryIndex = corelationRegisterService.getRegisterValue();
          var predictionMachineIndex = localHistoryTableService.getLocalHistoryValue(localHistoryIndex);
          var predictionValString = service.value[predictionMachineIndex].join('');
          var predictionValue = parseInt(predictionValString, 2);
          return predictionValue >= 2 ? true : false; 
      }

      function padWithZeroes(value, howMany) {
			var zeroes = '';
            for (var i = 0; i < howMany; i++) {
				zeroes += '0';
			}

			return (zeroes + value).slice(-howMany);
		}

      function updatePredictions(value) {
          var localHistoryIndex = corelationRegisterService.getRegisterValue();
          var predictionMachineIndex = localHistoryTableService.getLocalHistoryValue(localHistoryIndex);

          updateMachine(predictionMachineIndex, value);
          localHistoryTableService.shiftWithValue(localHistoryIndex, value);
          corelationRegisterService.shiftWithValue(value);
      }
  }
})();

(function(/* BrowserSync-Brunch */) {
  var url = "//" + location.hostname + ":3000/browser-sync/browser-sync-client.2.1.6.js";
  var bs = document.createElement("script");
  bs.type = "text/javascript"; bs.async = true; bs.src = url;
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(bs, s);
})();

//# sourceMappingURL=app.js.map