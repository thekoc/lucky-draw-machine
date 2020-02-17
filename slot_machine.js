/**
 * Created by koc on 08/05/2017.
 */
'use strict';

const configuration = require('./configuration');
const path = require('path');
const remote = require('electron').remote;


let TextHolder = {
    props: ['text'],
    template: '<div><span>{{ text }}</span></div>'
};

Vue.component('slot-column', {
    components: {
        'text-holder': TextHolder
    },
    props: ['column', 'animation_speed'],
    data: function () {
        return {
            should_continue: this.column.rolling,
            inline_height: 100,
            stop_rolling_times: 5,
            stopping: false,
            stopped: false,
            animation_delay: -1 * Math.random() * this.column.text_list.length / this.animation_speed
        }
    },
    computed: {
        column_length: function () {
            return this.text_list.length;
        },
        _rolling: function () {
            return this.column.rolling;
        },
        style_obj: function () {
            return {
                'line-height': String(this.inline_height) + 'px',
                'margin': '0 8px 0 8px',
                'font-size': String(this.inline_height) + 'px',
                'transition': 'margin-top 1s ease',
                'height': String(this.text_list.length * this.inline_height) + 'px',
                'animation-duration': String(this.text_list.length / this.animation_speed) + 's',
                'animation-delay': String(this.animation_delay) + 's'
            }
        },
        class_obj: function () {
            return {'rolling-column': this.should_continue, 'stopping-column': this.stopping}
        },
        text_list: function() {
            return this.column.text_list
        },
        real_text_list: function() {
            return this.column.text_list.concat(this.column.text_list.slice(0, 1));
        }

    },
    watch: {
        _rolling: function (new_value) {
            if (this.stopped && new_value === true) {
                this.restart();
            }
        },
        stopped: function (new_value) {
            if (new_value) {
                this.$emit('stopped')
            }
        }
    },

    methods: {
        stop_listener: function (event) {
            if (!this.column.rolling) {
                if (!this.stopping) {
                    // enter stopping state
                    this.should_continue = false;
                    this.stopping = true;
                    this.animation_delay = 0;
                } else {
                    // enter stopped state
                    this.stopping = false;
                    this.stopped = true;
                }
            } else {
                this.should_continue = true;
                this.stopping = false;
                this.stopped = false;
            }
        },
        restart: function () {
            this.should_continue = true;
            this.stopping = false;
            this.stopped = false;
            this.animation_delay = String(this.animation_delay) + 's';
        }
    },
    template: '<div class="holder">' +
    '<div :style="style_obj" class="text-holder" :class="class_obj" @animationed="stop_listener" @animationiteration="stop_listener">' +
    '<text-holder v-for="text in real_text_list" :key="text" :text="text"></text-holder>' +
    '</div>' +
    '</div>'
});

Vue.component('slot-machine', {
    template: '<div>' +
    '<div class="slot-machine">' +
        '<div style="position: relative">' +
        '<div ref="fake_prize_title" class="prize-title-container" style="position: absolute; display: none"><span class="prize-title-text">{{ fake_title_value }}</span></div>' +
        '<div class="prize-title-container" ref="prize_title_container" @transitionend="resize_done"><span @transitionend.stop="title_opacity_done" class="prize-title-text" :style="{opacity: title_opacity}">{{ prize_title_value }}</span></div>' +
        '</div>' +
        '<div class="slot-columns">'+
    '<slot-column v-for="column in column_list" :key="column" :animation_speed="animation_speed" :column="column" @stopped="column_stopped_handler"></slot-column>' +
        '</div>'+
    '</div>' +
        '<div class="button-container">' +
    '<button class="round-button slot-machine-button" @click="toggle_button_handler" :disabled="button.disabled">{{ button.message }}</button>' +
    '<button class="round-button slot-machine-button" @click="reset_button_handler">RESET</button>' +
        '</div>' +
        '<div class="follow-prizes-container">' +
        '<h2>Next prize: </h2>' +
        '<transition-group name="prizes" tag="div" style="position: relative; transition: all 1s;" :style="{height: prize_list_height}">' +
        '<div v-if="residual_prize_list.length === 0" class="prizes-item no-more-item" :key="0"><span>No available prize</span><a @click="save_result"">Save the result</a></div>' +
        '<div v-for="prize in residual_prize_list" :key="prize.id" class="prizes-item">' +
            '{{ prize.name }}' +
        '</div>' +
        '</transition-group>'+
    '</div>'+
    '</div>'
    ,
    props: ['column_list', 'speeds', 'max_column_length', 'get_name_list', 'get_prize_list'],
    data: function () {
        return {
            rolling: true,
            residual_prize_list: [],
            column_num: 5,
            state: {'waiting': false, 'running': true},
            stopped_column_num: 0,
            prize_title_value: 'Hi! Please Press RESET button!',
            fake_title_value: 'Hi! Please Press RESET button!',
            this_turn: {
                winner: undefined,
                prize: undefined
            },
            win_history: [],
            button: {
                disabled: true,
                message: 'STOP'
            },
            title_opacity: 1,
        }
    },
    computed: {
        animation_speed: function () {
            return this.speeds.animation_speed;
        },
        stop_speed: function () {
            return this.speeds.stop_speed;
        },
        prize_title: {
            get: function () {
                return this.prize_title_value;
            },
            set: function (new_value) {
                if (new_value !== this.prize_title_value) {
                    this.title_opacity = 0;
                    this.fake_title_value = new_value;
                }

            }
        },
        prize_list_height: function () {
            return String(Math.max(this.residual_prize_list.length, 1) * 50) + 'px'
        }
    },
    beforeDestroy: function () {
        window.removeEventListener('resize', this.handle_prize_title_resize)
    },
    mounted: function () {
        this.handle_prize_title_resize();
        window.addEventListener('resize', this.handle_prize_title_resize)
    },
    methods: {
        save_result: function () {
            this.$emit('save', this.win_history);
        },
        handle_prize_title_resize: function () {
            let $t1 = $(this.$refs.prize_title_container);
            let $t2 = $(this.$refs.fake_prize_title);
            $t1.outerHeight($t2.outerHeight());
            $t1.outerWidth($t2.outerWidth());
        },
        resize_done: function () {
            this.title_opacity = 1;
        },
        title_opacity_done: function () {
            if (this.title_opacity === 0) {
                let $t1 = $(this.$refs.prize_title_container);
                let $t2 = $(this.$refs.fake_prize_title);
                if ($t1.outerHeight() !== $t2.outerHeight() || $t1.outerWidth() !== $t2.outerWidth()) {
                    this.prize_title_value = this.fake_title_value;
                    this.handle_prize_title_resize();
                } else {
                    this.prize_title_value = this.fake_title_value;
                    this.resize_done();
                }
            }
        },
        stop: function () {
            this.rolling = false;
            let t = 0;
            for (let column of column_list) {
                setTimeout(() => {
                    if (!this.rolling) {
                        column.rolling = false
                    }
                }, t);
                t += 10000 / this.animation_speed / this.stop_speed * (1 + Math.random() * 0.5);
            }
        },
        restart: function () {
            this.stopped_column_num = 0;
            this.rolling = true;
            for (let column of column_list) {
                column.rolling = true
            }
        },
        reset: function () {
            this.residual_prize_list.length = 0;
            let pl = this.get_prize_list();
            let id = 0;
            for (let p of pl) {
                for (let i = 0; i < p.number; i+=1) {
                    this.residual_prize_list.push({name: p.name, id: id});
                    id += 1;
                }
            }
            this.draw_next_prize();
            this.switch_to('running');
            this.button.message = 'STOP';
        },
        get_new_column_list: function () {
            let l = _.sample(this.get_name_list(), this.max_column_length);
            this.this_turn.winner = l[0];
            column_list = [];
            for (let i = 0; i < this.column_num; i+=1) {
                let text_list = [];
                for (let j = 0; j < this.max_column_length; j+= 1) {
                    if (j < l.length) {
                        if (this.column_num - i - 1 < l[j].length) {
                            text_list.push(l[j][l[j].length - this.column_num + i]);
                        } else {
                            text_list.push('#');
                        }
                    }
                }
                column_list.push(new SlotColumn(text_list));
            }
            return column_list;
        },
        draw_next_prize: function () {
            let prize = '';
            if (this.residual_prize_list.length > 0) {
                prize = this.residual_prize_list[0].name;
                this.residual_prize_list = this.residual_prize_list.slice(1);
                this.this_turn.prize = prize;
                this.button.disabled = false;
                this.prize_title = 'Prize: ' + prize;
                this.restart();
                this.column_list = this.get_new_column_list();
                this.win_history.push({prize: this.this_turn.prize, winner: this.this_turn.winner});
            } else {
                if (this.get_prize_list().length <= 0) {
                    this.prize_title = 'No available prize configured. You can add new in the setting panel'
                } else {
                    this.prize_title = 'No remaining prize. Please press RESET button';
                }
                this.button.disabled = true;
            }
        },
        switch_to: function (state) {
            if (!this.state.hasOwnProperty(state)) {
                throw new Error('Wrong key: ' + state);
            }
            for (let key in this.state) {
                if (this.state.hasOwnProperty(key)) {
                    this.state[key] = (key === state);
                }
            }
        },
        toggle_button_handler: function () {
            this.$emit('audio', 'buttonClick');
            if (this.state['running']) {
                this.stop();
                this.button.disabled = true;
                this.switch_to('waiting');
                this.button.message = 'NEXT';
            } else if (this.state['waiting']) {
                this.draw_next_prize();
                this.switch_to('running');
                this.button.message = 'STOP';
            }
        },
        reset_button_handler: function () {
            this.$emit('audio', 'buttonClick');
            this.reset();
        },
        column_stopped_handler: function () {
            this.stopped_column_num += 1;
            this.$emit('audio', 'stop');
            if (this.stopped_column_num === this.column_num) {
                this.prize_title = this.this_turn.winner + ' won ' + this.this_turn.prize;
                this.button.disabled = false;
            }
        },
    }
});


function SlotColumn(text_list) {
    this.rolling = true;
    this.text_list = text_list;
 }

let column_list = [];
for (let i = 0; i < 5; i += 1) {
    let l = [];
    for (let j = 0; j < 3; j += 1) {
        l.push(String('#'));
    }
    column_list.push(new SlotColumn(l))
}

let speeds = configuration.readSettings('speeds');
window.SlotMachine = {speeds: speeds};

let slot_machine = new Vue({
    el: '#slot-machine-container',
    data: {
        column_list: column_list,
        speeds: speeds,
        max_column_length: 5,
        get_name_list: () => configuration.readSettings('names'),
        get_prize_list: () => configuration.readSettings('prizes'),
    },
    methods: {
        audio_handler: function (message) {
            if (message === 'buttonClick') {
                let audio = new Audio(path.join(__dirname, 'audio', 'button.mp3'));
                audio.play();
            } else if (message === 'stop') {
                let audio = new Audio(path.join(__dirname, 'audio', 'stop.wav'));
                audio.play();
            }
        },
        save_handler: function (result_list) {
            function save_file(filename) {
                let text = '';
                let fs = require('fs');
                if (typeof filename !== 'undefined') {
                    for (let r of result_list) {
                        text += (r.prize + ': ' + r.winner + '\r\n');
                    }

                    fs.writeFile(filename, text, function(err){
                        if(err){
                            console.log(err);
                        }
                    })
                }
            }
            if (result_list.length > 0) {
                remote.dialog.showSaveDialog({title: 'Select where to save the result'}, save_file);
            }
        }
    }
});
