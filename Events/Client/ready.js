module.exports = {
    name: "ready",
    execute(client) {
        console.log("Client OK");
        client.user.setActivity('verifications', {type: 'WATCHING'});
    }
}