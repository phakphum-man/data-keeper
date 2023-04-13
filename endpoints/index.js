module.exports = function (app) {
	
    app.get('/', (req, res) => {
        // #swagger.ignore = true

        return res.status(200).send("Start API Keeper");
    });

    app.get('/download', (req, res) => {
        // #swagger.ignore = true
        const file = req.query.f;

        if(!file)
            return res.status(404).send("Not Found");
        // HTML jquery script download chunks
        return res.status(200).send(`download = "${req.query.f}"`);
    });
}