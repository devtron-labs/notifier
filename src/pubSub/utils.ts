import * as process from "process";

export const NOTIFICATION_EVENT_TOPIC: string = "NOTIFICATION_EVENT_TOPIC"
export const NOTIFICATION_EVENT_GROUP: string = "NOTIFICATION_EVENT_GROUP"
export const NOTIFICATION_EVENT_DURABLE: string = "NOTIFICATION_EVENT_DURABLE"
export const ORCHESTRATOR_STREAM: string = "ORCHESTRATOR"
const ackWait: number = parseInt(process.env.ACK_WAIT)
const maxAge: number = parseInt(process.env.MAX_AGE)
const numberOfRetriesFetched: number = parseInt(process.env.NO_OF_RETRIES)||5
// Ensure the value is not greater than 5
export const numberOfRetries = Math.min(numberOfRetriesFetched, 5);

export interface NatsTopic {
    topicName: string
    streamName: string
    queueName: string
    consumerName: string
}

export interface NatsConsumerConfig {
    ack_wait: number
}

export interface NatsStreamConfig {
    max_age: number
   // num_replicas: number  // Currently not supporting changing replica count of stream as it can be done from orchestrator side via publish function
}

export let NatsTopicMapping = new Map<string, NatsTopic>([
    [NOTIFICATION_EVENT_TOPIC, {
        topicName: NOTIFICATION_EVENT_TOPIC,
        streamName: ORCHESTRATOR_STREAM,
        queueName: NOTIFICATION_EVENT_GROUP,
        consumerName: NOTIFICATION_EVENT_DURABLE
    }]
])


export const NatsConsumerWiseConfigMapping = new Map<string, NatsConsumerConfig>(
    [[NOTIFICATION_EVENT_DURABLE, {

        ack_wait: !isNaN(ackWait) ? ackWait * 1e9 : 30 * 1e9,

    }]
    ]);

export const NatsStreamWiseConfigMapping = new Map<string, NatsStreamConfig>(
    [[ORCHESTRATOR_STREAM, {

        max_age: !isNaN(maxAge) ? maxAge * 1e9 : 120 * 1e9,
      //  num_replicas: !isNaN(streamReplica) ? streamReplica : 0, //Currently not supporting changing replica count of stream as it can be done from orchestrator side via publish function

    }]
    ]);

export function GetStreamSubjects(streamName: string): string[] {
    let subjArr: string[] = [];
    for (const [_, natsTopic] of NatsTopicMapping) {
        if (natsTopic.streamName === streamName) {
            subjArr.push(natsTopic.topicName);
        }
    }

    return subjArr;

}