"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const disposable_1 = require("@phosphor/disposable");
const apputils_1 = require("@jupyterlab/apputils");
const widgets_1 = require("@phosphor/widgets");
const notebook_1 = require("@jupyterlab/notebook");
require("../style/index.css");
/**
 * The plugin registration information.
 */
const plugin = {
    activate,
    id: 'runcells_ext',
    autoStart: true
};
/**
 * A notebook widget extension that adds a button to the toolbar.
 */
class ExperimentExtension {
    /**
     * Create a new extension object.
     */
    createNew(panel, context) {
        let prefix = panel.content.title.label;
        let meta_key = "EXP_DICT";
        //  function to display cell ids
        function displayCellIDs() {
            let content_div = document.getElementById(panel.content.id);
            for (let i = 0; i < content_div.childElementCount; i++) {
                let cell_prompt_div = content_div.children[i].children[1].children[1].children[0];
                var cell_tag_div;
                if (cell_prompt_div.childElementCount < 1) {
                    cell_tag_div = document.createElement('div');
                }
                else {
                    cell_tag_div = cell_prompt_div.children[0];
                }
                cell_tag_div.innerHTML = "(" + String(i) + ")";
                cell_prompt_div.appendChild(cell_tag_div);
            }
        }
        //*************************************************************************//
        //*************************************************************************//
        //*************************************************************************//
        let callback = () => {
            // **** actually run the experiment
            //get the raw string from the input
            let label = document.getElementById(prefix + 'exp_select').innerText;
            let tab_cell = document.getElementById(prefix + label + "_exp_string");
            if (tab_cell) {
                var raw_str = tab_cell.innerText;
                var exp_array = raw_str.split('-');
                exp_array.forEach(cell_str => {
                    var cell_id = Number(cell_str);
                    if (!isNaN(cell_id)) {
                        panel.content.activeCellIndex = cell_id;
                        notebook_1.NotebookActions.run(panel.content, context.session);
                        panel.content.deselectAll();
                    }
                });
            }
            else {
                document.getElementById(prefix + "exp_dropdown").classList.toggle("show", true);
            }
        };
        //*************************************************************************//
        //*************************************************************************//
        //*************************************************************************//
        panel.context.ready.then(() => {
            displayCellIDs();
            // create and populate the (initially) hidden dropdown div
            //create and fill the content of the dropdown div
            let dropdown_div = document.createElement('div');
            dropdown_div.id = prefix + "exp_dropdown";
            dropdown_div.setAttribute("class", "dropdown-content");
            //create the drop down table
            let dd_tab = document.createElement('table');
            dd_tab.id = prefix + "drop_down_table";
            // get the saved experiments from the notebook metadata
            if (!panel.model.metadata.has(meta_key)) {
                panel.model.metadata.set(meta_key, {});
            }
            let EXP_DICT = panel.model.metadata.get(meta_key);
            //* method to create a row in the experiments table */
            function createExperimentRow(label, exp_string) {
                let row = document.createElement('tr');
                row.id = prefix + label;
                // create cell for label button
                let td1 = document.createElement('td');
                let label_button = document.createElement("button");
                label_button.innerText = label;
                label_button.classList.add("jp-ToolbarButtonComponent", "jp-label-buttons");
                label_button.id = prefix + label + "_label_button";
                function setExperiment() {
                    let btn = document.getElementById(prefix + "exp_select");
                    btn.innerText = label_button.innerText;
                    btn.setAttribute("value", td2.innerText);
                }
                label_button.onclick = setExperiment;
                td1.appendChild(label_button);
                // create cell for exp_string
                let td2 = document.createElement('td');
                td2.id = prefix + label + "_exp_string";
                td2.innerText = exp_string;
                // create remove button in third cell
                let td3 = document.createElement('td');
                let del_btn = document.createElement("button");
                del_btn.classList.add("jp-ToolbarButtonComponent");
                let del_btn_span = document.createElement("span");
                del_btn_span.classList.add("jp-CloseIcon", "jp-Icon", "jp-Icon-16", "jp-ToolbarButtonComponent-icon");
                del_btn.appendChild(del_btn_span);
                function delExperiment() {
                    delete EXP_DICT[label];
                    panel.model.metadata.set(meta_key, EXP_DICT);
                    let tab = document.getElementById(prefix + "drop_down_table");
                    tab.removeChild(row);
                    let btn = document.getElementById(prefix + "exp_select");
                    if (btn.innerText == label_button.innerText) {
                        btn.innerText = "Select Experiment";
                    }
                }
                del_btn.onclick = delExperiment;
                td3.appendChild(del_btn);
                // add all three cells to the row
                row.appendChild(td1);
                row.appendChild(td2);
                row.appendChild(td3);
                return row;
            }
            /* Add each experiment from the metadata to the experiments table */
            for (let key in EXP_DICT) {
                let value = EXP_DICT[key];
                let row = createExperimentRow(key, value);
                dd_tab.appendChild(row);
            }
            //create the input row of the table
            let input_row = document.createElement('tr');
            //create value tag and td
            let value_text = document.createElement('input');
            value_text.placeholder = 'Label the cell path';
            value_text.id = prefix + 'val_input';
            let input_value_td = document.createElement('td');
            input_value_td.appendChild(value_text);
            //create a input tag and td
            let input_text = document.createElement('input');
            input_text.placeholder = "Cell # separated by '-'";
            input_text.id = prefix + 'exp_input';
            let input_text_td = document.createElement('td');
            input_text_td.appendChild(input_text);
            // add a button to save the new experiment
            let add_btn = document.createElement("button");
            add_btn.classList.add("jp-ToolbarButtonComponent");
            let add_btn_span = document.createElement("span");
            add_btn_span.classList.add("jp-AddIcon", "jp-Icon", "jp-Icon-16", "jp-ToolbarButtonComponent-icon");
            add_btn.appendChild(add_btn_span);
            // add_btn.innerText = "Add";
            //* callback to add an experiment to the metadata and the experiments table */
            function addExperiment() {
                let label = document.getElementById(prefix + "val_input").value;
                let exp_string_input = document.getElementById(prefix + "exp_input");
                let exp_string = exp_string_input.value;
                // error check the experiments string
                // check to make sure the cell indices are between 0 and panel.model.cells.length-1
                // check to make sure the string are valid numbers
                var cell_inds = [];
                if (exp_string) {
                    var exp_array = exp_string.split('-');
                    for (let i in exp_array) {
                        var cell_index = Number(exp_array[i]);
                        if (!isNaN(cell_index) && Number.isInteger(cell_index) && cell_index >= 0 && cell_index < panel.model.cells.length) {
                            cell_inds.push(String(cell_index));
                        }
                        else {
                            apputils_1.showErrorMessage("Invalid cell order", "Cell order must be a list of cell indices separated by dashes (e.g. 0-1-2)");
                            return;
                        }
                    }
                    exp_string = cell_inds.join("-");
                    EXP_DICT[label] = exp_string;
                    panel.model.metadata.set(meta_key, EXP_DICT);
                    let row = document.getElementById(prefix + label);
                    if (row) {
                        row.children[1].innerText = exp_string;
                    }
                    else {
                        row = createExperimentRow(label, exp_string);
                        dd_tab.insertBefore(row, dd_tab.firstChild);
                    }
                }
                else {
                    console.log('No experiment set!');
                    apputils_1.showErrorMessage("Enter a cell order", "Cell order must be a list of cell indices separated by dashes (e.g. 0-1-2)");
                    return;
                }
            }
            add_btn.onclick = addExperiment;
            let btn_td = document.createElement("td");
            btn_td.appendChild(add_btn);
            // add both to the row tag
            input_row.appendChild(input_value_td);
            input_row.appendChild(input_text_td);
            input_row.appendChild(btn_td);
            // add the row to the table
            dd_tab.appendChild(input_row);
            //add table to dropdown div
            dropdown_div.appendChild(dd_tab);
            // add the dropdown div to the main panel
            panel.node.appendChild(dropdown_div);
            //*************************************************************************//
            //************************ handle changes to the cell order
            panel.model.cells.changed.connect((cell_list, changed) => {
                displayCellIDs();
                let EXP_DICT = panel.model.metadata.get(meta_key);
                if (changed.type == "add") {
                    var addedInd = changed.newIndex;
                    for (let label in EXP_DICT) {
                        let exp_string = EXP_DICT[label];
                        let new_exp_array = [];
                        exp_string.split('-').forEach(cell_str => {
                            var cell_index = Number(cell_str);
                            if (cell_index < addedInd) {
                                new_exp_array.push(String(cell_index));
                            }
                            else {
                                new_exp_array.push(String(cell_index + 1));
                            }
                        });
                        EXP_DICT[label] = new_exp_array.join("-");
                    }
                }
                if (changed.type == "remove") {
                    var removedInd = changed.oldIndex;
                    for (let label in EXP_DICT) {
                        let exp_string = EXP_DICT[label];
                        let new_exp_array = [];
                        exp_string.split('-').forEach(cell_str => {
                            var cell_index = Number(cell_str);
                            if (cell_index < removedInd) {
                                new_exp_array.push(String(cell_index));
                            }
                            else if (cell_index > removedInd) {
                                new_exp_array.push(String(cell_index - 1));
                            }
                        });
                        EXP_DICT[label] = new_exp_array.join("-");
                    }
                }
                if (changed.type == "move") {
                    var newInd = changed.newIndex;
                    var oldInd = changed.oldIndex;
                    for (let label in EXP_DICT) {
                        let exp_string = EXP_DICT[label];
                        let new_exp_array = [];
                        exp_string.split('-').forEach(cell_str => {
                            var cell_index = Number(cell_str);
                            if (newInd < oldInd) {
                                if (cell_index >= newInd && cell_index < oldInd) {
                                    new_exp_array.push(String(cell_index + 1));
                                }
                                else if (cell_index < newInd || cell_index > oldInd) {
                                    new_exp_array.push(String(cell_index));
                                }
                                else if (cell_index == oldInd) {
                                    new_exp_array.push(String(newInd));
                                }
                            }
                            else {
                                if (cell_index > oldInd && cell_index <= newInd) {
                                    new_exp_array.push(String(cell_index - 1));
                                }
                                else if (cell_index < oldInd || cell_index > newInd) {
                                    new_exp_array.push(String(cell_index));
                                }
                                else if (cell_index == oldInd) {
                                    new_exp_array.push(String(newInd));
                                }
                            }
                        });
                        EXP_DICT[label] = new_exp_array.join("-");
                    }
                }
                // display the updates in the dropdown div
                for (let label in EXP_DICT) {
                    let row = document.getElementById(prefix + label);
                    if (EXP_DICT[label] == "") {
                        delete EXP_DICT[label];
                        let btn = document.getElementById(prefix + "exp_select");
                        if (btn.innerText == label) {
                            btn.innerText = "Select Experiment";
                        }
                        let tab = document.getElementById(prefix + "drop_down_table");
                        tab.removeChild(row);
                    }
                    else {
                        if (row) {
                            row.children[1].innerText = EXP_DICT[label];
                        }
                    }
                }
                // write the updates to the metadata
                panel.model.metadata.set(meta_key, EXP_DICT);
            }); // end signal connection
            //*************************************************************************//
            panel.content.activeCellChanged.connect(() => { displayCellIDs(); });
            notebook_1.NotebookActions.executed.connect(() => { displayCellIDs(); });
        }); // end on panel ready
        //*************************************************************************//
        //*************************************************************************//
        //*************************************************************************//
        //create a new widget for the toolbar that is a button that toggles the dropdown options
        let ddm_widget = new widgets_1.Widget();
        let ddm_div = document.createElement('div');
        ddm_div.setAttribute("style", "position: relative; display: inline-block;");
        let exp_select = document.createElement("button");
        function displayExp() {
            document.getElementById(prefix + "exp_dropdown").classList.toggle("show");
        }
        exp_select.onclick = displayExp;
        exp_select.innerText = "Select Experiment";
        exp_select.classList.add("jp-ToolbarButtonComponent");
        exp_select.id = prefix + "exp_select";
        // add the button to the ddm div
        ddm_div.appendChild(exp_select);
        // add the div to the ddm widget
        ddm_widget.node.appendChild(ddm_div);
        /****************************************************************************/
        //*************************************************************************//
        //create a new button
        let button = new apputils_1.ToolbarButton({
            className: 'myButton',
            iconClassName: 'fa fa-fast-forward',
            onClick: callback,
            tooltip: 'Run Experiments'
        });
        /****************************************************************************/
        //*************************************************************************//
        panel.toolbar.insertItem(9, 'Experiments Cells Input', ddm_widget);
        panel.toolbar.insertItem(10, 'Experiments', button);
        return new disposable_1.DisposableDelegate(() => {
            button.dispose();
        });
    }
}
exports.ExperimentExtension = ExperimentExtension;
/**
 * Activate the extension.
 */
function activate(app) {
    app.docRegistry.addWidgetExtension('Notebook', new ExperimentExtension());
}
;
exports.default = plugin;
