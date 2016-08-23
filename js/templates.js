(function() {
    var module;

    try {
        // Get current templates module
        module = angular.module('app');
    } catch (error) {
        // Or create a new one
        module = angular.module('app', []);
    }

    module.run(["$templateCache", function($templateCache) {
        $templateCache.put('app/TestModule/test.html', '<div class=\"container\">\n    <div class=\"row\">\n        <div class=\"col-md-6\">\n            <div class=\"row\">\n                <button class=\"btn btn-default\"\n                        ng-click=\"vm.corelationRegisterCollapse = !vm.corelationRegisterCollapse\"\n                        >Show Corelation Register</button>\n\n                <div uib-collapse=\"vm.corelationRegisterCollapse\">\n                    <corelation-register></corelation-register>\n                </div>\n            </div>\n\n            <div class=\"row\">\n                <button class=\"btn btn-default\"\n                        ng-click=\"vm.localHistoryCollapse = !vm.localHistoryCollapse\"\n                        >Show Local History Registers</button>\n                        \n                <div uib-collapse=\"vm.localHistoryCollapse\">\n                    <local-history-table></local-history-table>\n                </div>\n            </div>\n            <div class=\"row\">\n                <button class=\"btn btn-default\"\n                        ng-click=\"vm.predictionMachinesCollapse = !vm.predictionMachinesCollapse\"\n                        >Show Prediction Machines</button>\n\n                <div uib-collapse=\"vm.predictionMachinesCollapse\">\n                    <prediction-machines></prediction-machines>\n                </div>\n            </div>\n        </div>\n\n        <div class=\"col-md-6\">\n            <code-input></code-input>\n        </div>        \n    </div>\n</div>');
    }]);
})();
(function() {
    var module;

    try {
        // Get current templates module
        module = angular.module('app');
    } catch (error) {
        // Or create a new one
        module = angular.module('app', []);
    }

    module.run(["$templateCache", function($templateCache) {
        $templateCache.put('app/codeInput/code-input.html', '<h4>Please input your code</h4>\n\n<textarea name=\"codeInput\" rows=\"20\" cols=\"40\"\n        ng-model=\"ci.codeInput\"></textarea>\n<br>\n<button type=\"button\"\n        class=\"btn btn-default\"\n        name=\"doPrediction\"\n        ng-click=\"ci.doPrediction(ci.codeInput)\"\n        >Predict!</button>\n\n<input type=\"checkbox\"\n        name=\"stepByStep\"\n        id=\"stepByStep\"\n        ng-model=\"ci.stepByStep\">\n</input>\n\n<label for=\"stepByStep\" \n        style=\"font-weight:normal;\">Step By Step</label>\n\n<button type=\"button\"\n        class=\"btn btn-default\"\n        name=\"stepForward\"\n        ng-if=\"ci.stepByStep && ci.pipelineStarted\"\n        ng-click=\"ci.goToNextBranchInstruction(ci.codeArray)\"> \n        >>\n</button>\n\n<div ng-if=\"ci.stepByStep && ci.pipelineStarted\">\n        <input type=\"checkbox\"\n                name=\"nextPredictionIsFalse\"\n                id=\"nextPredictionFalse\"\n                ng-model=\"ci.EXModel.nextPredictionFalse\"/>\n\n<label for=\"nextPredictionFalse\"\n        style=\"font-weight:normal;\">Next prediction is false!</label>\n</div>\n\n<div>IF: \n        <div ng-repeat=\"instruction in ci.IFModel.instructionsInIF\">{{instruction}}</div>\n</div>\n<div>ID: \n        <div ng-repeat=\"instruction in ci.IDModel.instructionsInID\">{{ci.common.instructionToText(instruction)}}</div>\n</div>\n<div>EX: \n        <div ng-repeat=\"instruction in ci.EXModel.instructionsInEX\">{{ci.common.instructionToText(instruction)}}</div>\n</div>\n<div>WB: \n        <div ng-repeat=\"instruction in ci.WBModel.instructionsInWB\">{{ci.common.instructionToText(instruction)}}</div>\n</div>\n');
    }]);
})();
(function() {
    var module;

    try {
        // Get current templates module
        module = angular.module('app');
    } catch (error) {
        // Or create a new one
        module = angular.module('app', []);
    }

    module.run(["$templateCache", function($templateCache) {
        $templateCache.put('app/corelationRegister/corelation-register.html', '<h3>Please enter the size (in bits) of the Corelation Register:</h3>\n\n<input type=\"number\"\n    name=\"sizeOfCorelationRegister\"\n    ng-model=\"corReg.corelationRegister.size\"\n    ng-change=\"corReg.updateValues()\">\n\n<div class=\"row\">\n    <div class=\"col-sm-2\">\n<table class=\"table table-condensed\">\n    <thead>\n        <tr>\n            <!-- <th ng-repeat=\"value in corReg.corelationRegister.value track by $index\"></th> -->\n        </tr>\n    </thead>\n    <tbody>\n        <tr>\n            <td ng-repeat=\"value in corReg.corelationRegister.value track by $index\">\n                {{value}}\n            </td>\n        </tr>\n    </tbody>\n</table>\n</div>\n</div>\n');
    }]);
})();
(function() {
    var module;

    try {
        // Get current templates module
        module = angular.module('app');
    } catch (error) {
        // Or create a new one
        module = angular.module('app', []);
    }

    module.run(["$templateCache", function($templateCache) {
        $templateCache.put('app/localHistoryTable/local-history-table.html', '<h3>Please enter the size (in bits) of the Local history table entry:</h3>\n\n<input type=\"number\"\n    name=\"sizeOfLHEntry\"\n    ng-model=\"lht.localHistoryTable.size\"\n    ng-change=\"lht.updateValues(lht.localHistoryTable.size)\">\n\n<div class=\"row\">\n    <div class=\"col-sm-2\">\n<table class=\"table table-condensed\">\n    <thead>\n        <tr>\n            <!-- <th ng-repeat=\"value in lht.localHistoryTable.value track by $index\"></th> -->\n        </tr>\n    </thead>\n    <tbody>\n        <tr ng-repeat=\"lhtRow in lht.localHistoryTable.value\">\n            {{lhtRow}}\n            <td ng-repeat=\"lhtValue in lhtRow track by $index\">\n                {{lhtValue}}\n            </td>\n        </tr>\n    </tbody>\n</table>\n</div>\n</div>\n');
    }]);
})();
(function() {
    var module;

    try {
        // Get current templates module
        module = angular.module('app');
    } catch (error) {
        // Or create a new one
        module = angular.module('app', []);
    }

    module.run(["$templateCache", function($templateCache) {
        $templateCache.put('app/predictionMachines/prediction-machines.html', '<div class=\"row\">\n    <div class=\"col-sm-2\">\n\n<table class=\"table table-condensed\">\n    <thead>\n        <tr>\n            <!-- <th ng-repeat=\"value in lht.localHistoryTable.value track by $index\"></th> -->\n        </tr>\n    </thead>\n    <tbody>\n        <tr ng-repeat=\"pmRow in pm.predictionMachines.value\">\n            {{pmRow}}\n            <td ng-repeat=\"pmValue in pmRow track by $index\">\n                {{pmValue}}\n            </td>\n        </tr>\n    </tbody>\n</table>\n</div>\n</div>\n');
    }]);
})();

//# sourceMappingURL=templates.js.map