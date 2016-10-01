// Export supported versions
exports.cliVersion = '>=3.X';

var TAG = 'TiFabric',
    VERSION = '1.0.1',
    API_KEY = '314d44c2561b54141cbf4ebfe159b3d6ef5d5546',
    API_SECRET = 'ba336c85bfb3dceec47e90c80284ff023422ac6b5e88374133ef64bb3089c0c8',
    CRASHLYTICS_VERSION = '2.6.2',
    CRASHLYTICS_BUILD_ID = '3a75dac7-9e92-49d7-bd45-3db3bb0d357c',
    fs = require('fs'),
    fse = require('fs-extra');

exports.init = function(logger, config, cli, appc) {

	logger.info(TAG + ' : initiated');

	var isProd = (cli.argv['deploy-type'] || cli.argv['deployment-type']) === 'production';

	//if (isProd || cli.argv['fabric-enabled'] === 'true') {
	if (true) {

		logger.info(TAG + ' : ' + ' initialization enabled');

		var projectDir = cli.argv['project-dir'];

		if (cli.argv['platform'] == 'ios' || cli.argv['platform'] == 'iphone' || cli.argv['platform'] == 'ipad') {

			var modules = cli.tiapp.modules;
			for (var i in modules) {
				var module = modules[i];
				if (module.id == 'ti.fabric' && module.version) {
					VERSION = module.version;
					break;
				}
			}

			cli.on('build.ios.xcodebuild', {

				pre : function(build, done) {

					try {

						logger.debug(TAG + ' : ' + cli.tiapp.name + ' - processing fabric for ios');

						var pbxprojPath = projectDir + '/build/iphone/' + cli.tiapp.name + '.xcodeproj/project.pbxproj',
						    pbxprojStr = fs.readFileSync(pbxprojPath).toString(),
						    sectionName = 'Post-Compile',
						    shellScript = '\\nchmod 755 ../../modules/iphone/ti.fabric/' + VERSION + '/platform/Fabric.framework/*\\n../../modules/iphone/ti.fabric/' + VERSION + '/platform/Fabric.framework/run ' + (cli.argv['fabric-key'] || API_KEY) + ' ' + (cli.argv['fabric-secret'] || API_SECRET);

						var success = false;
						var p = 0;
						while (p !== -1) {
							p = pbxprojStr.indexOf('name = "' + sectionName + '"', p);
							if (p !== -1) {
								p = pbxprojStr.indexOf('shellScript = ', p);
								if (p !== -1) {
									pbxprojStr = pbxprojStr.substring(0, p) + 'shellScript = "' + pbxprojStr.substring(p + 'shellScript = '.length + 1, pbxprojStr.indexOf('\n', p) - 2) + shellScript + '";' + pbxprojStr.substring(pbxprojStr.indexOf('\n', p));
									success = true;
								}
							}
						}

						if (!success) {
							success = false;
							p = 0;
							p = pbxprojStr.indexOf('buildPhases = (', p);
							if (p !== -1) {
								p = pbxprojStr.indexOf(');', p);
								if (p !== -1) {
									pbxprojStr = pbxprojStr.substring(0, p) + '	CD3EAD351B05FF060042DBFC /* NativeScript PostBuild */,\n			' + pbxprojStr.substring(p);
									success = true;
								}
							}
							if (success) {
								success = false;
								p = 0;
								p = pbxprojStr.indexOf('/* End PBXShellScriptBuildPhase section */', p);
								if (p !== -1) {
									pbxprojStr = pbxprojStr.substring(0, p) + '		CD3EAD351B05FF060042DBFC /* NativeScript PostBuild */ = {\n			isa = PBXShellScriptBuildPhase;\n			buildActionMask = 2147483647;\n			files = (\n			);\n			inputPaths = (\n			);\n			name = "NativeScript PostBuild";\n			outputPaths = (\n			);\n			runOnlyForDeploymentPostprocessing = 0;\n			shellPath = /bin/sh;\n			shellScript = "' + shellScript + '";\n			showEnvVarsInLog = 0;\n		};\n' + pbxprojStr.substring(p);
									success = true;
								}
							}
						}

						if (success) {
							fs.writeFileSync(pbxprojPath, pbxprojStr);
							logger.debug(TAG + ' : ' + cli.tiapp.name + ' - saved fabric for ios - ' + pbxprojPath);
						} else {
							logger.debug(TAG + ' : ' + cli.tiapp.name + ' - FAILED fabric for ios - ' + pbxprojPath);
						}

						done();

					} catch(e) {

						logger.error(TAG + ' : ' + cli.tiapp.name + ' - ERROR ' + e);
						return;

					}

				}
			});

		} else if (cli.argv['platform'] == 'android') {

			cli.on('build.android.writeAndroidManifest', {

				post : function(build, done) {

					try {

						logger.debug(TAG + ' : ' + ' processing fabric for android');

						var buildDir = projectDir + '/build/android/',
						    srcFabricProperties = projectDir + '/plugins/ti.fabric/android/fabric.properties',
						    srcKitsProperties = projectDir + '/plugins/ti.fabric/android/kits.properties',
						    srcCustomRules = projectDir + '/plugins/ti.fabric/android/custom_rules.xml',
						    srcCrashlyticsBuild = projectDir + '/plugins/ti.fabric/android/crashlytics-build.properties',
						    srcCrashlyticsBuildId = projectDir + '/plugins/ti.fabric/android/com_crashlytics_build_id.xml',
						    srcCrashlyticsFld = projectDir + '/plugins/ti.fabric/android/crashlytics';

						var fabricPropertiesContent = fs.readFileSync(srcFabricProperties).toString()
							.replace("API_SECRET", (cli.argv['fabric-secret'] || API_SECRET));
						fs.writeFileSync(buildDir + 'fabric.properties', fabricPropertiesContent);

						var kitsPropertiesContent = fs.readFileSync(srcKitsProperties).toString()
							.replace("CRASHLYTICS_VERSION", CRASHLYTICS_VERSION);
						fs.writeFileSync(buildDir + 'kits.properties', kitsPropertiesContent);

						var customRulesContent = fs.readFileSync(srcCustomRules).toString()
							.replace("PROJECT_NAME", cli.tiapp.name);
						fs.writeFileSync(buildDir + 'custom_rules.xml', customRulesContent);

						var srcCrashlyticsBuildContent = fs.readFileSync(srcCrashlyticsBuild).toString()
							.replace("CRASHLYTICS_BUILD_ID", CRASHLYTICS_BUILD_ID)
							.replace("PROJECT_NAME", cli.tiapp.name)
							.replace("PROJECT_VERSION", cli.tiapp.version)
							.replace("PROJECT_ID", cli.tiapp.id);
						fs.writeFileSync(buildDir + '/bin/assets/crashlytics-build.properties', srcCrashlyticsBuildContent);

						var crashlyticsBuildIdContent = fs.readFileSync(srcCrashlyticsBuildId).toString()
							.replace("CRASHLYTICS_BUILD_ID", CRASHLYTICS_BUILD_ID);
						fs.writeFileSync(buildDir + '/res/values/com_crashlytics_build_id.xml', crashlyticsBuildIdContent);

						fse.copySync(srcCrashlyticsFld, buildDir + 'crashlytics');

						done();

					} catch(e) {

						logger.error(TAG + ' : ' + e);
						return;

					}
				}
			});

		}

	}

};
