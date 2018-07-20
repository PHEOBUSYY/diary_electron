let parser = require('cron-parser');

try {
    // let interval = parser.parseExpression('0 20 9,11,17 * * *');//每天8.12.17点半 执行一次
    let interval = parser.parseExpression('*/15 * * * * *');//每天8.12.17点半 执行一次
    // let interval = parser.parseExpression('0 */25 * * * *');

    console.log('Date: ', interval.next().toString()); // Sat Dec 29 2012 00:42:00 GMT+0200 (EET)
    console.log('Date: ', interval.next().toString());
    console.log('Date: ', interval.next().toString());
    console.log('Date: ', interval.next().toString());
    console.log('Date: ', interval.next().toString());

    // console.log('Date: ', interval.prev().toString()); // Sat Dec 29 2012 00:42:00 GMT+0200 (EET)
    // console.log('Date: ', interval.prev().toString()); // Sat Dec 29 2012 00:40:00 GMT+0200 (EET)
} catch (err) {
    console.log('Error: ' + err.message);
}