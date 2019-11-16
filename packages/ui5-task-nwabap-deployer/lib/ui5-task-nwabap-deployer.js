"use strict";

const Logger = require("./Logger");
const glob = require("glob");
const ui5Deployercore = require("ui5-nwabap-deployer-core");

/**
 * UI5 Tooling Task for deploying UI5 Sources to a SAP NetWeaver ABAP system
 *
 * @param {Object} parameters Parameters
 * @param {module:@ui5/fs.DuplexCollection} parameters.workspace DuplexCollection to read and write files
 * @param {module:@ui5/fs.AbstractReader} parameters.dependencies Reader or Collection to read dependency files
 * @param {Object} parameters.options Options
 * @param {string} parameters.options.projectName Project name
 * @param {string} [parameters.options.configuration] Task configuration if given in ui5.yaml
 * @returns {Promise<undefined>} Promise resolving with <code>undefined</code> once data has been written
 */
module.exports = async function({ workspace, dependencies, options }) {
    const oLogger = new Logger();

    if (options.configuration && !options.configuration.resources) {
        oLogger.error("Please provide a resources configuration.");
        return;
    }

    if ((options.configuration && !options.configuration.connection) && !process.env.UI5_TASK_NWABAP_DEPLOYER__SERVER) {
        oLogger.error("Please provide a connection configuration.");
        return;
    }

    let sServer = process.env.UI5_TASK_NWABAP_DEPLOYER__SERVER;

    if (options.configuration && options.configuration.connection && options.configuration.connection.server) {
        sServer = options.configuration.connection.server;
    } else {
        options.configuration.connection = Object.assign({}, options.configuration.connection);
    }

    if ((options.configuration && !options.configuration.authentication) &&
        (!process.env.UI5_TASK_NWABAP_DEPLOYER__USER && !process.env.UI5_TASK_NWABAP_DEPLOYER__PASSWORD)) {
        oLogger.error("Please provide an authentication configuration or set authentication environment variables.");
        return;
    }

    let sUser = process.env.UI5_TASK_NWABAP_DEPLOYER__USER;
    let sPassword = process.env.UI5_TASK_NWABAP_DEPLOYER__PASSWORD;

    if (options.configuration && options.configuration.authentication && options.configuration.authentication.user) {
        sUser = options.configuration.authentication.user;
    }

    if (options.configuration && options.configuration.authentication && options.configuration.authentication.password) {
        sPassword = options.configuration.authentication.password;
    }

    if (options.configuration && !options.configuration.ui5) {
        oLogger.error("Please provide a UI5 configuration.");
        return;
    }

    let sPattern = "**/*.*";
    if (options.configuration && options.configuration.resources && options.configuration.resources.pattern) {
        sPattern = options.configuration.resources.pattern;
    }

    const aFiles = glob.sync(sPattern, { dot: true, cwd: options.configuration.resources.path });

    const oDeployOptions = {
        resources: {
            fileSourcePath: options.configuration.resources.path
        },
        conn: {
            server: sServer,
            client: options.configuration.connection.client,
            useStrictSSL: options.configuration.connection.useStrictSSL,
            proxy: options.configuration.connection.proxy
        },
        auth: {
            user: sUser,
            pwd: sPassword
        },
        ui5: {
            language: options.configuration.ui5.language,
            transportno: options.configuration.ui5.transportNo,
            package: options.configuration.ui5.package,
            bspcontainer: options.configuration.ui5.bspContainer,
            bspcontainer_text: options.configuration.ui5.bspContainerText,
            create_transport: !!options.configuration.ui5.createTransport,
            transport_text: options.configuration.ui5.transportText,
            transport_use_user_match: !!options.configuration.ui5.transportUseUserMatch,
            transport_use_locked: !!options.configuration.ui5.transportUseLocked,
            calc_appindex: !!options.configuration.ui5.calculateApplicationIndex
        }
    };

    try {
        await ui5Deployercore.deployUI5toNWABAP(oDeployOptions, aFiles, oLogger);
    } catch (oError) {
        oLogger.error(oError);
    }
};
