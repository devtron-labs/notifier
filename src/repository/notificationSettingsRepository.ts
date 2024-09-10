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

import { NotificationSettings } from "../entities/notificationSettings";
import { Brackets, getManager } from "typeorm";
import { ENV_TYPE_INT } from "../common/types";

export class NotificationSettingsRepository {
  // note: if the query in this func is changed, please update the same query in orchestrator
  async findByEventSource(
    pipelineType: string,
    pipelineId: number,
    eventTypeId: number,
    appId: number,
    envId: number,
    teamId: number,
    clusterId: number,
    isProdEnv: boolean
  ): Promise<NotificationSettings[]> {
    if (eventTypeId == 6) {
      //this is the case when deployment is blocked and pipeline is set to auto trigger
      eventTypeId = 3;
    }

    var envIdentifier = ENV_TYPE_INT.AllExistingAndFutureNonProdEnvs;
    if (isProdEnv === true) {
      envIdentifier = ENV_TYPE_INT.AllExistingAndFutureProdEnvs;
    }

    var queryObj = getManager()
      .getRepository(NotificationSettings)
      .createQueryBuilder("ns")
      .where("ns.pipeline_type = :pipelineType", { pipelineType: pipelineType })
      .andWhere("ns.event_type_id = :eventTypeId", { eventTypeId: eventTypeId })
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            new Brackets((qb) => {
              qb.where("ns.app_id = :appId", { appId: appId })
                .andWhere("ns.env_id is NULL")
                .andWhere("ns.team_id is NULL")
                .andWhere("ns.pipeline_id is NULL");
            })
          )
            .orWhere(
              new Brackets((qb) => {
                qb.where("ns.app_id is NULL")
                  .andWhere("ns.env_id = :envId", { envId: envId })
                  .andWhere("ns.team_id is NULL")
                  .andWhere("ns.pipeline_id is NULL");
              })
            )
            .orWhere(
              new Brackets((qb) => {
                qb.where("ns.app_id is NULL")
                  .andWhere("ns.env_id = :envIdentifier", {
                    envIdentifier: envIdentifier,
                  })
                  .andWhere("ns.team_id is NULL")
                  .andWhere("ns.pipeline_id is NULL");
              })
            )

            .orWhere(
              new Brackets((qb) => {
                qb.where("ns.app_id is NULL")
                  .andWhere("ns.env_id is NULL")
                  .andWhere("ns.team_id = :teamId", { teamId: teamId })
                  .andWhere("ns.pipeline_id is NULL");
              })
            )
            .orWhere(
              new Brackets((qb) => {
                qb.where("ns.app_id is NULL")
                  .andWhere("ns.env_id is NULL")
                  .andWhere("ns.team_id is NULL")
                  .andWhere("ns.pipeline_id = :pipelineId", {
                    pipelineId: pipelineId,
                  });
              })
            )
            .orWhere(
              new Brackets((qb) => {
                qb.where("ns.app_id is NULL")
                  .andWhere("ns.env_id = :envId", { envId: envId })
                  .andWhere("ns.team_id = :teamId", { teamId: teamId })
                  .andWhere("ns.pipeline_id is NULL");
              })
            )
            .orWhere(
              new Brackets((qb) => {
                qb.where("ns.app_id is NULL")
                  .andWhere("ns.env_id = :envIdentifier", {
                    envIdentifier: envIdentifier,
                  })
                  .andWhere("ns.team_id = :teamId", { teamId: teamId })
                  .andWhere("ns.pipeline_id is NULL");
              })
            )
            .orWhere(
              new Brackets((qb) => {
                qb.where("ns.app_id = :appId", { appId: appId })
                  .andWhere("ns.team_id is NULL")
                  .andWhere("ns.env_id = :envId", { envId: envId })
                  .andWhere("ns.pipeline_id is NULL");
              })
            )
            .orWhere(
              new Brackets((qb) => {
                qb.where("ns.app_id = :appId", { appId: appId })
                  .andWhere("ns.team_id is NULL")
                  .andWhere("ns.env_id = :envIdentifier", {
                    envIdentifier: envIdentifier,
                  })
                  .andWhere("ns.pipeline_id is NULL");
              })
            )
            .orWhere(
              new Brackets((qb) => {
                qb.where("ns.app_id = :appId", { appId: appId })
                  .andWhere("ns.env_id = :envId", { envId: envId })
                  .andWhere("ns.team_id = :teamId", { teamId: teamId })
                  .orWhere("ns.pipeline_id = :pipelineId", {
                    pipelineId: pipelineId,
                  });
              })
            )
            .orWhere(
              new Brackets((qb) => {
                qb.where("ns.app_id =:appId", { appId: appId })
                  .andWhere("ns.env_id is NULL")
                  .andWhere("ns.cluster_id = :clusterId", {
                    clusterId: clusterId,
                  });
              })
            )
            .orWhere(
              new Brackets((qb) => {
                qb.where("ns.app_id is NULL")
                  .andWhere("ns.env_id is NULL")
                  .andWhere("ns.team_id = :teamId", { teamId: teamId })
                  .andWhere("ns.cluster_id = :clusterId", {
                    clusterId: clusterId,
                  });
              })
            )
            .orWhere(
              new Brackets((qb) => {
                qb.where("ns.app_id is NULL ")
                  .andWhere("ns.env_id is NULL")
                  .andWhere("ns.team_id is NULL")
                  .andWhere("ns.cluster_id = :clusterId", {
                    clusterId: clusterId,
                  });
              })
            )
            .orWhere(
              new Brackets((qb) => {
                qb.where("ns.app_id =:appId", { appId: appId })
                  .andWhere("ns.env_id = :envIdentifier", {
                    envIdentifier: envIdentifier,
                  })
                  .andWhere("ns.cluster_id = :clusterId", {
                    clusterId: clusterId,
                  });
              })
            )
            .orWhere(
              new Brackets((qb) => {
                qb.where("ns.app_id is NULL")
                  .andWhere("ns.env_id = :envIdentifier", {
                    envIdentifier: envIdentifier,
                  })
                  .andWhere("ns.team_id = :teamId", { teamId: teamId })
                  .andWhere("ns.cluster_id = :clusterId", {
                    clusterId: clusterId,
                  });
              })
            )
            .orWhere(
              new Brackets((qb) => {
                qb.where("ns.app_id is NULL ")
                  .andWhere("ns.env_id = :envIdentifier", {
                    envIdentifier: envIdentifier,
                  })
                  .andWhere("ns.team_id is NULL")
                  .andWhere("ns.cluster_id = :clusterId", {
                    clusterId: clusterId,
                  });
              })
            );
        })
      );
      // var query = queryObj.getQuery();
      // var params = queryObj.getParameters();
      return await queryObj.getMany();
  }
}

/*
.orWhere(new Brackets(qb => {
    qb.where("ns.app_id = :appId", {appId: appId})
        .andWhere("ns.env_id = :envId", {envId: envId})
        .andWhere("ns.team_id = :teamId", {teamId: teamId})
        .orWhere("ns.pipeline_id = :pipelineId", {pipelineId: pipelineId})
}))
 */
