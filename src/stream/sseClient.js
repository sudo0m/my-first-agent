export function createNoopStreamPublisher() {
    return {
        publish() {
            return null;
        }
    };
}
