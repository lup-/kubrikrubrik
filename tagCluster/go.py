import gensim.downloader as download_api
import numpy as np
from scipy.cluster.hierarchy import *
from pymystem3 import Mystem
import csv

def convertTagToUniPos(yandexTag):
    mapping = {
        "A": "ADJ",
        "ADV": "ADV",
        "ADVPRO": "ADV",
        "ANUM": "ADJ",
        "APRO": "DET",
        "COM": "ADJ",
        "CONJ": "SCONJ",
        "INTJ": "INTJ",
        "NONLEX": "X",
        "NUM": "NUM",
        "PART": "PART",
        "PR": "ADP",
        "S": "NOUN",
        "SPRO": "PRON",
        "UNKN": "X",
        "V": "VERB"
    }

    return mapping[yandexTag]


def tag(processed):
    try:
        lemma = processed["analysis"][0]["lex"].lower().strip()
        pos = processed["analysis"][0]["gr"].split(',')[0]
        pos = pos.split('=')[0].strip()
        tagged = lemma + '_' + convertTagToUniPos(pos)
        return tagged
    except Exception:
        return None


def stemAndTag(text):
    m = Mystem()
    allProcessed = m.analyze(text)
    taggedLemmas = map(tag, allProcessed)
    taggedLemmas = list(filter(None, taggedLemmas))
    return taggedLemmas


def filterByModel(tokens, model):
    modelWords = set(model.index2word)
    return list(filter(lambda token: token in modelWords, tokens))


def prepareTopic(topic, model):
    return filterByModel(stemAndTag(topic), model)


def preparedDistance(preparedA, preparedB, model):
    return model.n_similarity(preparedA, preparedB)


def textDistance(textA, textB, model):
    preparedA = filterByModel(stemAndTag(textA), model)
    preparedB = filterByModel(stemAndTag(textB), model)

    return preparedDistance(preparedA, preparedB, model)


model = download_api.load('word2vec-ruscorpora-300')

topicsFile = open('topics.txt', 'r')
topics = [l.strip('"') for l in topicsFile.read().splitlines()]
topicsFile.close()

preparedTopics = []
for topic in topics:
    preparedTopics.append(prepareTopic(topic, model))

countTopics = len(preparedTopics)
distanceMatrix = [[0] * countTopics for i in range(countTopics)]
for indexA, topicA in enumerate(preparedTopics):
    for indexB, topicB in enumerate(preparedTopics):
        distanceMatrix[indexA][indexB] = preparedDistance(topicA, topicB, model)
distanceMatrix = np.array(distanceMatrix)

print(distanceMatrix)

z = linkage(distanceMatrix, 'ward')
dendrogram(z)
clustersCount = 8
clusterNums = fcluster(z, clustersCount, criterion='maxclust')

results = [{"topic": topic, "group": str(clusterNums[index])} for index, topic in enumerate(topics)]
print(results)

with open("clusters.csv", "w") as output:
    writer = csv.writer(output, lineterminator='\n')
    for line in results:
        writer.writerow([line['topic'], line['group']])
    output.close()
