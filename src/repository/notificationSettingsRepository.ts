import {NotificationSettings} from "../entities/notificationSettings";
import {Brackets, getManager} from "typeorm";

export class NotificationSettingsRepository {
    async findByEventSource(pipelineType: string, pipelineId: number, eventTypeId: number, appId: number, envId: number, teamId: number): Promise<NotificationSettings[]> {
        if (eventTypeId == 6){//this is the case when deployment is blocked and pipeline is set to auto trigger
            eventTypeId = 3
        }
        return await getManager().getRepository(NotificationSettings).createQueryBuilder("ns")
            .where("ns.pipeline_type = :pipelineType", {pipelineType: pipelineType})
            .andWhere("ns.event_type_id = :eventTypeId", {eventTypeId: eventTypeId})
            .andWhere(
                new Brackets(qb => {
                    qb.where("ns.app_id = :appId", {appId: appId})
                        .andWhere("ns.env_id is NULL")
                        .andWhere("ns.team_id is NULL")
                        .andWhere("ns.pipeline_id is NULL")
                        .orWhere(new Brackets(qb => {
                            qb.where("ns.app_id is NULL")
                                .andWhere("ns.env_id = :envId", {envId: envId})
                                .andWhere("ns.team_id is NULL")
                                .andWhere("ns.pipeline_id is NULL")
                                .orWhere(new Brackets(qb => {
                                    qb.where("ns.app_id is NULL")
                                        .andWhere("ns.env_id is NULL")
                                        .andWhere("ns.team_id = :teamId", {teamId: teamId})
                                        .andWhere("ns.pipeline_id is NULL")
                                        .orWhere(new Brackets(qb => {
                                            qb.where("ns.app_id is NULL")
                                                .andWhere("ns.env_id is NULL")
                                                .andWhere("ns.team_id is NULL")
                                                .andWhere("ns.pipeline_id = :pipelineId", {pipelineId: pipelineId})
                                                .orWhere(new Brackets(qb => {
                                                    qb.where("ns.app_id is NULL")
                                                        .andWhere("ns.env_id = :envId", {envId: envId})
                                                        .andWhere("ns.team_id = :teamId", {teamId: teamId})
                                                        .andWhere("ns.pipeline_id is NULL")
                                                        .orWhere(new Brackets(qb => {
                                                            qb.where("ns.app_id = :appId", {appId: appId})
                                                                .andWhere("ns.env_id is NULL")
                                                                .andWhere("ns.team_id = :teamId", {teamId: teamId})
                                                                .andWhere("ns.pipeline_id is NULL")
                                                                .orWhere(new Brackets(qb => {
                                                                    qb.where("ns.app_id = :appId", {appId: appId})
                                                                        .andWhere("ns.env_id = :envId", {envId: envId})
                                                                        .andWhere("ns.team_id = :teamId", {teamId: teamId})
                                                                        .orWhere("ns.pipeline_id = :pipelineId", {pipelineId: pipelineId})
                                                                }))
                                                        }))
                                                }))
                                        }))
                                }))
                        }))
                })).getMany()
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