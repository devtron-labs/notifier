/*
 * Copyright (c) 2024. Devtron Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Mocha from 'mocha';
import * as path from 'path';
import * as fs from 'fs';

// Create a new Mocha instance
const mocha = new Mocha({
    ui: 'bdd',
    color: true
});

// Get the test file path from command line arguments
const testFile = process.argv[2];

if (!testFile) {
    console.error('Please specify a test file to run');
    process.exit(1);
}

// Check if the file exists
if (!fs.existsSync(testFile)) {
    console.error(`Test file not found: ${testFile}`);
    process.exit(1);
}

// Add the test file to Mocha
mocha.addFile(testFile);

// Run the tests
mocha.run(failures => {
    process.exitCode = failures ? 1 : 0;
});
