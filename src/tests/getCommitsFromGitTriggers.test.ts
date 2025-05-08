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

import { getCommitsFromGitTriggers } from '../common/getCommitsFromGitTriggers';
import { expect } from 'chai';

describe('getCommitsFromGitTriggers', () => {
    it('should return an empty array when material is null or undefined', () => {
        expect(getCommitsFromGitTriggers(null)).to.deep.equal([]);
        expect(getCommitsFromGitTriggers(undefined)).to.deep.equal([]);
    });

    it('should return an empty array when gitTriggers or ciMaterials are missing', () => {
        expect(getCommitsFromGitTriggers({})).to.deep.equal([]);
        expect(getCommitsFromGitTriggers({ gitTriggers: {} })).to.deep.equal([]);
        expect(getCommitsFromGitTriggers({ ciMaterials: [] })).to.deep.equal([]);
    });

    it('should extract commits from gitTriggers based on ciMaterials IDs', () => {
        const material = {
            gitTriggers: {
                '101': {
                    Commit: 'a61f69d7889eae63bbfe95d87f5dde1e4d090cad',
                    Author: 'Badal Kumar Prusty <badalkumar@Badals-MacBook-Pro.local>',
                    Date: '2025-04-08T07:28:12Z',
                    Message: 'added react project\n',
                    Changes: null,
                    WebhookData: {
                        id: 0,
                        eventActionType: '',
                        data: null
                    },
                    CiConfigureSourceValue: 'main',
                    GitRepoUrl: 'https://github.com/badal773/test.git',
                    GitRepoName: 'test',
                    CiConfigureSourceType: 'SOURCE_TYPE_BRANCH_FIXED'
                },
                '76': {
                    Commit: 'b72f69d7889eae63bbfe95d87f5dde1e4d090cad',
                    Author: 'Badal Kumar Prusty <badalkumar@Badals-MacBook-Pro.local>',
                    Date: '2025-04-08T07:28:12Z',
                    Message: 'added react project\n',
                    Changes: null,
                    WebhookData: {
                        id: 0,
                        eventActionType: '',
                        data: null
                    },
                    CiConfigureSourceValue: 'main',
                    GitRepoUrl: 'https://github.com/badal773/test.git',
                    GitRepoName: 'test',
                    CiConfigureSourceType: 'SOURCE_TYPE_BRANCH_FIXED'
                }
            },
            ciMaterials: [
                {
                    id: 76,
                    gitMaterialId: 62,
                    gitMaterialUrl: '',
                    gitMaterialName: 'test',
                    type: 'SOURCE_TYPE_BRANCH_FIXED',
                    value: 'main',
                    active: true,
                    lastFetchTime: '0001-01-01T00:00:00Z',
                    isRepoError: false,
                    repoErrorMsg: '',
                    isBranchError: false,
                    branchErrorMsg: '',
                    url: 'https://github.com/badal773/test.git'
                },
                {
                    id: 101,
                    gitMaterialId: 80,
                    gitMaterialUrl: '',
                    gitMaterialName: 'test',
                    type: 'SOURCE_TYPE_BRANCH_FIXED',
                    value: 'main',
                    active: true,
                    lastFetchTime: '0001-01-01T00:00:00Z',
                    isRepoError: false,
                    repoErrorMsg: '',
                    isBranchError: false,
                    branchErrorMsg: '',
                    url: 'https://github.com/badal773/test.git'
                }
            ]
        };

        const expectedCommits = [
            'b72f69d7889eae63bbfe95d87f5dde1e4d090cad',
            'a61f69d7889eae63bbfe95d87f5dde1e4d090cad'
        ];

        expect(getCommitsFromGitTriggers(material)).to.deep.equal(expectedCommits);
    });

    it('should handle missing commits in gitTriggers', () => {
        const material = {
            gitTriggers: {
                '101': {
                    // No Commit field
                    Author: 'Badal Kumar Prusty',
                    Date: '2025-04-08T07:28:12Z'
                },
                '76': {
                    Commit: 'b72f69d7889eae63bbfe95d87f5dde1e4d090cad',
                    Author: 'Badal Kumar Prusty',
                    Date: '2025-04-08T07:28:12Z'
                }
            },
            ciMaterials: [
                { id: 76 },
                { id: 101 },
                { id: 102 } // ID not in gitTriggers
            ]
        };

        const expectedCommits = ['b72f69d7889eae63bbfe95d87f5dde1e4d090cad'];
        expect(getCommitsFromGitTriggers(material)).to.deep.equal(expectedCommits);
    });
});
