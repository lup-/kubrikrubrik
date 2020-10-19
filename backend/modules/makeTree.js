const makeTree = function (allItems, parentId = null) {
    let foundTopics = allItems.filter( topic => {
        let hasParents = topic.parents && topic.parents.length > 0;
        let emptyParentsAndRequestedEmpty = !hasParents && (parentId === null);

        return hasParents
            ? topic.parents.indexOf(parentId) !== -1
            : emptyParentsAndRequestedEmpty;
    });

    foundTopics.map(topic => {
        topic.children = makeTree(allItems, topic.id);
        return topic;
    });

    return foundTopics;
}

module.exports = makeTree;