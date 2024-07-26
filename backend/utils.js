const moment = require('moment');
const CryptoJS = require('crypto-js');
const { Todo, Event, User, Notification } = require('./models');


const mongoFormatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const handleDateRange = async (chatId, days, step) => {
    const today = moment().toDate();

    if (step === 'show_past') {
        startDate = moment(today).subtract(days, 'days').toDate();
        endDate = today;
    } else if (step === 'show_future') {
        startDate = today;
        endDate = moment(today).add(days, 'days').toDate();
    } else {
        throw new Error('Unknown step');
    }

    const todos = await getTodos(chatId, mongoFormatDate(startDate), mongoFormatDate(endDate));
    const events = await getEvents(chatId, mongoFormatDate(startDate), mongoFormatDate(endDate));
    if (!todos && !events) {
        return 'No plans for this day';
    }
    else if (!todos && events) {
        return `__*Events*__\n${events}`;
    }
    else if (todos && !events) {
        return `__*To-Do's*__\n${todos}`;
    }

    return `__*To-Do's*__\n${todos}\n\n\n__*Events*__\n${events}`;
};

const getEvents = async (chatId, date1, date2) => {
    if (date2 === undefined) {
        const data = await Event.find({ userId: chatId.toString(), date: date1 });
        if (data.length === 0) {
            return 'You don\'t have any Events for today';
        }

        const todayData = data.find(block => block.date === date1);

        if (!todayData) {
            return 'You don\'t have any Events for today';
        }

        const encryptedData = decryptData(todayData.events);

        const formattedEvents = encryptedData.map(event => {
            const eventTime = moment(event.time).format('HH:mm');
            return `*${eventTime}* - ${event.text}`;
        }).join('\n');


        return formattedEvents;
    }
    else {
        const data = await Event.find({ userId: chatId.toString(), date: { $gte: date1, $lte: date2 } });

        if (data.length === 0) {
            return 'You don\'t have any Events for these days';
        }

        let events = '';
        const startDate = moment(date1, 'DD-MM-YYYY');
        const endDate = moment(date2, 'DD-MM-YYYY');

        for (let date = startDate.clone().add(1, 'days'); date <= endDate; date.add(1, 'days')) {
            const formattedDate = date.format('DD-MM-YYYY');
            const dayData = data.find(day => day.date === formattedDate);

            if (!dayData) {
                events += `*➤ ${date.format('DD-MM-YYYY')}*\nYou don\'t have any Events for this day\n\n`;
            } else {
                const encryptedData = decryptData(dayData.events);
                const formattedEvents = encryptedData.map(event => {
                    const eventTime = moment(event.time, 'HH:mm').format('HH:mm');
                    return `*${eventTime}* - ${event.text}`;
                }).join('\n');
                events += `*➤ ${date.format('DD-MM-YYYY')}*\n${formattedEvents}\n\n`;
            }
        }

        events = events.trim();
        return events;
    }

};

const getTodos = async (chatId, date1, date2) => {
    if (date2 === undefined) {
        const data = await Todo.find({ userId: chatId.toString(), date: date1 });
        if (data.length === 0) {
            return 'You don\'t have any To-Do\'s for today';
        }

        const todayData = data.find(block => block.date === date1);

        if (!todayData) {
            return 'You don\'t have any To-Do\'s for today';
        }

        const encryptedData = decryptData(todayData.todos);
        const formattedTodos = encryptedData.map((todo) => {
            if (todo.checked) {
                return `●  ~${todo.text}~`;
            }
            return `○  ${todo.text}`;
        }).join('\n');

        return formattedTodos;

    }
    else {
        const data = await Todo.find({ userId: chatId.toString(), date: { $gte: date1, $lte: date2 } });
        if (data.length === 0) {
            return 'You don\'t have any To-Do\'s for these days';
        }


        let todos = '';
        const startDate = moment(date1, 'DD-MM-YYYY');
        const endDate = moment(date2, 'DD-MM-YYYY');
        for (let date = startDate.clone().add(1, 'days'); date <= endDate; date.add(1, 'days')) {
            const formattedDate = date.format('DD-MM-YYYY');
            const dayData = data.find(day => day.date === formattedDate);

            if (!dayData) {
                todos += `*➤ ${date.format('DD-MM-YYYY')}*\nYou don\'t have any To-Do\'s for this day\n\n`;
            } else {
                const encryptedData = decryptData(dayData.todos);
                const formattedTodos = encryptedData.map((todo) => {
                    if (todo.checked) {
                        return `●  ~${todo.text}~`;
                    }
                    return `○  ${todo.text}`;
                }).join('\n');
                todos += `*➤ ${date.format('DD-MM-YYYY')}*\n${formattedTodos}\n\n`;
            }
        }

        todos = todos.trim();

        return todos;
    }
};

const decryptData = (encryptedData) => {
    const decryptedData = CryptoJS.AES.decrypt(encryptedData, process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
};

const escapeMarkdown = (text) => {
    const markdownChars = ['[', ']', '(', ')', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
    let escapedText = text;
    markdownChars.forEach((char) => {
        escapedText = escapedText.replace(new RegExp(`\\${char}`, 'g'), `\\${char}`);
    });
    return escapedText;
};



module.exports = {
    mongoFormatDate,
    handleDateRange,
    getEvents,
    getTodos,
    decryptData,
    escapeMarkdown
};