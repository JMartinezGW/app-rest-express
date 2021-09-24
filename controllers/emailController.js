const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'john.alexander.martinez@correounivalle.edu.co',
        pass: 'izbzifhmmljfghnt',
    },
});
exports.sendEmail = function (to, subject, message) {
    const mailOptions = {
        from: 'john.alexander.martinez@correounivalle.edu.co',
        to,
        subject,
        html: message,
    }
    transport.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error)
        } else {
            console.log('Email sent: ' + info.response)
        }
    })
};

exports.hasCustomerAccount = function (order) {
    
    if (order.user_id) {
        return true
    }

    return false
}

exports.hasVerifiedAccount = function (order) {

    if (order.customer && order.customer.verified_email) {
        return true
    }

    return false
}