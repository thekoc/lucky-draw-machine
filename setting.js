/**
 * Created by koc on 12/05/2017.
 */

'use strict';

const configuration = require('./configuration');
const remote = require('electron').remote;

$(document).ready(() => {
    $("#title-input").change(() => {
        let text_data = $("#title-input").val();
        if (text_data.replace(/(^\s*)|(\s*$)/g, "").length === 0) {
            $("#title").text("Little Drawing Machine");
        } else {
            $("#title").text(text_data);
        }
    });

    function save_name_list(name_list_text) {
        let list = name_list_text.split(/\r?\n/);
        list = list.filter((line) => line.replace(/(^\s*)|(\s*$)/g, "").length > 0);
        configuration.saveSettings('names', list);
    }

    $("#create-from-file-button").click(() => {
        function set_from_file(filename) {
            let fs = require('fs');
            if (typeof filename !== 'undefined') {
                fs.readFile(filename[0], "utf-8", (err, data) => {
                    if (err) {
                        throw err;
                    }
                    save_name_list(data);
                })
            }
        }
        remote.dialog.showOpenDialog({properties: ['openFile']}, set_from_file)
    });


    $("#edit-name-list-button").click(() => {
        $("#name-list-edit-textarea").val(configuration.readSettings('names').join('\r\n'));
        $("#edit-name-list-modal").modal('toggle');

    });

    $("#save-name-list-button").click(() => {
        save_name_list($("#name-list-edit-textarea").val());
        $("#edit-name-list-modal").modal('toggle');
    });

    Vue.component('list-control', {
        props: ['prize_list'],
        template: '<ul class="list-group">' +
        '<button type="button" class="list-group-item" @click="add_new_row">' +
        '<span class="glyphicon glyphicon-plus pull-right"></span>Add new prize' +
        '</button>' +
        '<table class="table table-bordered table-striped">' +
        '<tbody>' +
        '<tr v-for="(value, key) in prize_list" :key="[value.name, value.number]">' +
        '<td class="prize-info-td" :pk="key">' +
        '<a class="editable-text prize-name editable editable-click" :pk="key" href="#">' +
        '{{value.name}}' +
        '</a>' +
        '<a class="label label-default label-pill pull-right editable-text ' +
        'prize-number editable editable-click" :pk="key" href="#">{{value.number}}</a>' +
        '</td>' +
        '<td class="btn btn-danger delete-row-button" @click="delete_row(key)">Delete</td>' +
        '</tr>' +
        '</tbody>' +
        '</table>' +
        '</ul>',
        mounted: function () {
            this.make_editable();
        },
        updated: function () {
            this.make_editable();
        },
        methods: {
            add_new_row: function () {
                this.$emit('add_new_row');
            },
            delete_row: function (pk) {
                this.$emit('delete_row', pk);
            },
            make_editable: function () {
                let that = this;
                $('.prize-name').each(function () {
                    let $ele = $(this);
                    $ele.editable(({
                        type: 'text',
                        name: 'prize name',
                        mode: 'inline',
                        title: 'Enter prize name',
                        success: (_, new_value) => {
                            that.$emit('change_row', {pk: $ele.attr('pk'), key: 'name', value: new_value})
                        }
                    }))
                });


                $('.prize-number').each(function () {
                    let $ele = $(this);
                    $ele.editable(({
                        type: 'text',
                        name: 'prize number',
                        title: 'Enter prize number',
                        mode: 'popup',
                        inputclass: 'number-input-class',
                        clear: false,
                        validate: (value) => {
                            let regex = /^[0-9]+$/;
                            if (!regex.test(value)) {
                                return 'numbers only!';
                            }
                        },
                        success: (_, new_value) => {
                            that.$emit('change_row', {pk: $ele.attr('pk'), key: 'number', value: parseInt(new_value)})
                        }
                    }))
                });
            }
        }
    });

    let list_ctrl = new Vue({
        el: '#prize-list-ctrl',
        data: {
            'prize_list': configuration.readSettings('prizes'),
        },
        methods: {
            delete_row: function (pk) {
                this.prize_list.splice(pk, 1);
                configuration.saveSettings('prizes', this.prize_list);
            },
            add_new_row: function () {
                this.prize_list.push({'name': 'Super Prize', number: 1});
                configuration.saveSettings('prizes', this.prize_list);
            },
            change_row: function (message) {
                let {key, pk, value} = message;
                this.prize_list[pk][key] = value;
                configuration.saveSettings('prizes', this.prize_list);
            }
        },
    });


    window.pl = list_ctrl.prize_list;
    let speeds = window.SlotMachine.speeds;

    let speed_setting = new Vue({
        el: '#speed-setting',
        data: {
            animation_speed: speeds.animation_speed,
            stop_speed: speeds.stop_speed
        },
        watch: {
            animation_speed: function (new_value) {let regex = /^[0-9]+$/;
                if (/^[0-9]+$/.test(new_value)) {
                    speeds.animation_speed = new_value;
                    configuration.updateSettings('speeds', (speeds) => {
                        speeds.animation_speed = parseInt(new_value);
                        return speeds
                    })
                }
            },
            stop_speed: function (new_value) {
                if (/^[0-9]+$/.test(new_value)) {
                    speeds.stop_speed = new_value;
                    configuration.updateSettings('speeds', (speeds) => {
                        speeds.stop_speed = parseInt(new_value);
                        return speeds
                    })
                }
            }
        }
    })
});