import clone from "lodash.clone";

export default {
    data() {
        return {
            isSaving: false,
            isLoading: false,
            savedMessage: {},
            message: {},
            image: null,
        }
    },
    methods: {
        gotoMessageList() {
            this.$router.push({name: 'listMessages'});
        },
        gotoMessageDetails() {
            this.$router.push({name: 'viewMessage', params: {messageId: this.message.id}});
        },
        gotoMessageEdit() {
            this.$router.push({name: 'editMessage', params: {messageId: this.message.id}});
        },
        gotoSendMessage() {
            this.$router.push({name: 'sendMessage'});
        },
        resetMessage() {
            if (this.isNew) {
                this.message = {};
            }
            else {
                this.message = clone(this.savedMessage);
            }
        },
        async saveMessage() {
            this.isSaving = true;
            await this.$store.dispatch('saveMessage', {message: this.message, image: this.image});
            this.updateMessageState();
            this.isSaving = false;
            if (this.isNew) {
                let messageId = this.$store.state.message.message.id;
                this.$router.push({name: 'editMessage', params: {messageId}});
            }
        },
        updateMessageState() {
            this.message = this.$store.state.message.message;
            this.savedMessage = clone(this.message);
        },
        async loadMessage() {
            if (!this.messageId) {
                return;
            }
            this.isLoading = true;
            await this.$store.dispatch('loadMessage', this.messageId);
            this.isLoading = false;
            this.updateMessageState();
        },
        async deleteMessage() {
            this.isLoading = true;
            await this.$store.dispatch('deleteMessage', this.message);
            this.isLoading = false;
            this.updateMessageState();
        }
    },
}