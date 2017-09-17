InspectorInterface.StringInput = function (args) {

    var self = this;
    self.getValueFn = args.getValueFn;
    self.onChangeFn = args.onChangeFn;
    self.isActiveFn = args.isActiveFn;

    self.updateViewValue = function () {
        if(self.isActiveFn()) {
            self.propertyDiv.style.display = 'block';
            self.valueDiv.value = self.getValueFn();
        } else {
            self.propertyDiv.style.display = 'none';
        }
    }
    self.updateModelValue = function () {
        try {
            self.onChangeFn(self.valueDiv.value);
        } catch (e) {
            self.updateViewValue();
        }
    }

    self.isFocused = function () {
        return document.activeElement === self.valueDiv;
    }

    self.propertyDiv;
    self.valueDiv;
    self.getPropertyDiv = function () {
        var title = document.createElement('span');
        title.className = "inspector-input-title";
        title.innerHTML = args.title;

        self.valueDiv = document.createElement('input');
        self.valueDiv.className = 'inspector-input inspector-input-string ' + args.className;
        self.valueDiv.onchange = function (e) {
            self.updateModelValue();
        }

        self.propertyDiv = document.createElement('div');
        self.propertyDiv.className = 'inspector-property';
        self.propertyDiv.appendChild(title);
        self.propertyDiv.appendChild(self.valueDiv);
        return self.propertyDiv;
    }

}

InspectorInterface.SelectInput = function (args) {

    var self = this;
    self.getValueFn = args.getValueFn;
    self.onChangeFn = args.onChangeFn;
    self.isActiveFn = args.isActiveFn;
    self.options    = args.options;

    self.updateViewValue = function () {
        if(self.isActiveFn()) {
            self.propertyDiv.style.display = 'block';
            self.valueDiv.value = self.getValueFn();
        } else {
            self.propertyDiv.style.display = 'none';
        }
    }
    self.updateModelValue = function () {
        try {
            self.onChangeFn(self.valueDiv.value);
        } catch (e) {
            self.updateViewValue();
        }
    }

    self.propertyDiv;
    self.valueDiv;
    self.getPropertyDiv = function () {
        var title = document.createElement('span');
        title.className = "inspector-input-title";
        title.innerHTML = args.title;

        self.valueDiv = document.createElement('SELECT');
        self.valueDiv.className = 'inspector-input inspector-input-select ' + args.className;
        self.options.forEach(function (optionText) {
            var option = document.createElement("option");
            option.text = optionText;
            self.valueDiv.add(option);
        })
        self.valueDiv.onchange = function (e) {
            self.updateModelValue();
        }

        self.propertyDiv = document.createElement('div');
        self.propertyDiv.className = 'inspector-property';
        self.propertyDiv.appendChild(title);
        self.propertyDiv.appendChild(self.valueDiv);
        return self.propertyDiv;
    }

}

InspectorInterface.ColorInput = function (args) {

    var self = this;
    self.getValueFn = args.getValueFn;
    self.onChangeFn = args.onChangeFn;
    self.isActiveFn = args.isActiveFn;

    self.uuid = random.uuid4();
    self.colorPickerNeedsSetup = true;

    self.updateViewValue = function () {
        if(self.colorPickerNeedsSetup) {
            setupColorPicker(self.uuid, function (color) {
                self.updateModelValue(color.toString());
            });
            self.colorPickerNeedsSetup = false;
        }

        if(self.isActiveFn()) {
            self.propertyDiv.style.display = 'block';
            setTimeout(function () {
                $("#"+self.uuid).spectrum("set", self.getValueFn());
            }, 300);
        } else {
            self.propertyDiv.style.display = 'none';
        }
    }
    self.updateModelValue = function (val) {
        if(!val) return;
        try {
            self.onChangeFn(val);
        } catch (e) {
            self.updateViewValue();
        }
    }

    self.propertyDiv;
    self.valueDiv;
    self.getPropertyDiv = function () {
        var title = document.createElement('span');
        title.className = "inspector-input-title";
        title.innerHTML = args.title;
        
        self.valueDiv = document.createElement('div');
        self.valueDiv.className = 'inspector-input inspector-input-color';

        var picker = document.createElement('input');
        picker.type = 'text';
        picker.id = self.uuid;
        picker.style.display = 'none';
        self.valueDiv.appendChild(picker);

        self.propertyDiv = document.createElement('div');
        self.propertyDiv.className = 'inspector-property';
        self.propertyDiv.appendChild(title);
        self.propertyDiv.appendChild(self.valueDiv);
        return self.propertyDiv;
    }

}

InspectorInterface.CheckboxInput = function (args) {

    var self = this;
    self.getValueFn = args.getValueFn;
    self.onChangeFn = args.onChangeFn;
    self.isActiveFn = args.isActiveFn;

    self.updateViewValue = function () {
        if(self.isActiveFn()) {
            self.propertyDiv.style.display = 'block';
            self.valueDiv.checked = self.getValueFn();
        } else {
            self.propertyDiv.style.display = 'none';
        }
    }
    self.updateModelValue = function () {
        try {
            self.onChangeFn(self.valueDiv.checked);
        } catch (e) {
            self.updateViewValue();
        }
    }

    self.propertyDiv;
    self.valueDiv;
    self.getPropertyDiv = function () {
        var title = document.createElement('span');
        title.className = "inspector-input-title";
        title.innerHTML = args.title;

        self.valueDiv = document.createElement('input');
        self.valueDiv.type = 'checkBox';
        self.valueDiv.className = 'inspector-input inspector-input-checkbox ' + args.className;
        self.valueDiv.onchange = function (e) {
            self.updateModelValue();
        }

        self.propertyDiv = document.createElement('div');
        self.propertyDiv.className = 'inspector-property';
        self.propertyDiv.appendChild(title);
        self.propertyDiv.appendChild(self.valueDiv);
        return self.propertyDiv;
    }
}

InspectorInterface.InspectorButton = function (args) {

    var self = this;
    self.isActiveFn = args.isActiveFn;
    self.buttonAction = args.buttonAction;

    self.name = args.tooltipTitle;
    self.icon = "url("+args.icon+")";

    self.updateViewValue = function () {
        if(self.isActiveFn()) {
            self.buttonDiv.style.display = 'block';
        } else {
            self.buttonDiv.style.display = 'none';
        }
    }

    self.buttonDiv;
    self.getButtonDiv = function () {
        self.buttonDiv = document.createElement('div');
        self.buttonDiv.className = 'inspector-button tooltipElem inspector-button-' + args.colorClass;
        self.buttonDiv.style.backgroundImage = self.icon;
        self.buttonDiv.onclick = function () {
            self.buttonAction();
        }
        self.buttonDiv.setAttribute('alt', args.tooltipTitle);
        return self.buttonDiv;
    }

}

InspectorInterface.Divider = function (args) {

    var self = this;
    self.isActiveFn = function () { return true; };
    self.buttonAction = function () { return true; };

    self.name = '';
    self.icon = '';

    self.updateViewValue = function () { return true; };

    var elem = document.createElement('div');
    elem.className = 'inspector-divider';

    self.buttonDiv;
    self.getButtonDiv = function () {
        self.buttonDiv = document.createElement('div');
        self.buttonDiv.className = 'inspector-divider';
        return self.buttonDiv;
    }

}
