require('dotenv').config();
const { Client, APIErrorCode } = require("@notionhq/client");
const {
    CreatePageParameters,
    GetDatabaseResponse,
    GetPagePropertyResponse,
  } = require("@notionhq/client/build/src/api-endpoints");

function assertUnreachable(_x) {
    throw new Error("Didn't expect to get here")
}

function userToString(userBase) {
    return `${userBase.id}: ${userBase.name || "Unknown Name"}`
}

function extractPropertyItemValueToString(property) {
    switch (property.type) {
        case "checkbox":
            return property.checkbox.toString();
        case "created_by":
            return userToString(property.created_by);
        case "created_time":
            return new Date(property.created_time).toISOString();
        case "date":
            return property.date ? new Date(property.date.start).toISOString() : "";
        case "email":
            return property.email ?? "";
        case "url":
            return property.url ?? "";
        case "number":
            return typeof property.number === "number"
                ? property.number.toString()
                : "";
        case "phone_number":
            return property.phone_number ?? "";
        case "select":
            if (!property.select) {
                return "";
            }
            return property.select.name;
        case "multi_select":
            if (!property.multi_select) {
                return "";
            }
            return property.multi_select
                .map((select) => select.name)
                .join(", ");
        case "people":
            return userToString(property.people);
        case "last_edited_by":
            return userToString(property.last_edited_by);
        case "last_edited_time":
            return new Date(property.last_edited_time).toISOString();
        case "title":
            return (Array.isArray(property.title) && property.title.length > 0)? property.title[0].plain_text:"";
        case "rich_text":
            return (Array.isArray(property.rich_text) && property.rich_text.length > 0)? property.rich_text[0].plain_text: "";
        case "files":
            return property.files.map((file) => file.name).join(", ");
        case "formula":
            if (property.formula.type === "string") {
                return property.formula.string || "???";
            } else if (property.formula.type === "number") {
                return property.formula.number?.toString() || "???";
            } else if (property.formula.type === "boolean") {
                return property.formula.boolean?.toString() || "???";
            } else if (property.formula.type === "date") {
                return (
                    (property.formula.date?.start &&
                        new Date(property.formula.date.start).toISOString()) ||
                    "???"
                );
            } else {
                return assertUnreachable(property.formula);
            }
        case "rollup":
            if (property.rollup.type === "number") {
                return property.rollup.number?.toString() || "???";
            } else if (property.rollup.type === "date") {
                return (
                    (property.rollup.date?.start &&
                        new Date(property.rollup.date?.start).toISOString()) ||
                    "???"
                );
            } else if (property.rollup.type === "array") {
                return JSON.stringify(property.rollup.array);
            } else if (
                property.rollup.type === "incomplete" ||
                property.rollup.type === "unsupported"
            ) {
                return property.rollup.type;
            } else {
                return assertUnreachable(property.rollup);
            }
        case "relation":
            if (property.relation) {
                return property.relation.id;
            }
            return "???";
        case "status":
            return property.status?.name ?? "";
    }
    return assertUnreachable(property);
}

async function getOnce(databaseId, filter = undefined, sorts = undefined) {
    // docs filter => https://developers.notion.com/reference/post-database-query-filter
    // docs sort => https://developers.notion.com/reference/post-database-query-sort
    const data = await getAll(databaseId, filter, sorts);
    return (data.length > 0) ? data[0] : null;
}

async function getAll(databaseId, filter = undefined, sorts = undefined) {
    // docs filter => https://developers.notion.com/reference/post-database-query-filter
    // docs sort => https://developers.notion.com/reference/post-database-query-sort
    try {
        const notion = new Client({ auth: process.env.NOTION_TOKEN });
        //const { properties } = await notion.databases.retrieve({ database_id: databaseId})
        const myPage = await notion.databases.query({
            database_id: databaseId,
            filter,
            sorts,
        });
        
        if(myPage && myPage.results && myPage.results.length > 0) {
            return myPage.results.map((x) => {
                let newObject = x.properties;
                Object.keys(x.properties).forEach((key, index) => {
                    newObject[key] = extractPropertyItemValueToString(newObject[key]);
                });
                return newObject;
            });
        }
        return;
    } catch (error) {
        if (error.code === APIErrorCode.ObjectNotFound) {
            console.error('Object not found');
        } else {
            // Other error handling code
            console.error(error);
        }
        throw error;
    }
}

module.exports = { getAll, getOnce };