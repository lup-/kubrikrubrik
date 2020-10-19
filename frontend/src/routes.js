import ListTopics from "@/components/ListTopics";
import EditTopic from "@/components/EditTopic";
import ViewTopicStandalone from "@/components/ViewTopicStandalone";

import MessageForm from "@/components/MessageForm";
import ListMessages from "@/components/ListMessages";
import EditMessage from "@/components/EditMessage";


export default [
    { name: 'home', path: '/', component: ListTopics },
    { name: 'newTopic', path: '/topic/new', component: EditTopic },
    { name: 'editTopic', path: '/topic/edit/:topicId', component: EditTopic },
    { name: 'viewTopic', path: '/topic/view/:topicId', component: ViewTopicStandalone },
    { name: 'listTopics', path: '/topic/list', component: ListTopics },
    { name: 'sendMessage', path: '/message/new', component: MessageForm },
    { name: 'editMessage', path: '/message/edit/:messageId', component: EditMessage },
    { name: 'listMessages', path: '/message/list', component: ListMessages },
];