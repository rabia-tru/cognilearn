import { StudyDeck } from '../types';

export const SAMPLE_DECKS: StudyDeck[] = [
  {
    id: 'deck_sample_neuroscience',
    title: 'Neurobiology: Synaptic Transmission & Memory',
    summary: 'Explores how neurons communicate electrochemically through action potentials, neurotransmitter exocytosis, long-term potentiation (LTP), and the neurobiological basis of memory consolidation.',
    keyTopics: ['Action Potential', 'Synaptic Plasticity', 'Neurotransmitters', 'Long-Term Potentiation', 'Hippocampus'],
    estimatedStudyTimeMinutes: 12,
    sourceFileName: 'Neurobiology_Lecture_Notes_Ch4.pdf',
    sourceFileSize: '1.4 MB',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    stats: {
      timesStudied: 3,
      bestQuizScore: 88,
      quizzesTaken: 2,
      lastStudiedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    flashcards: [
      {
        id: 'fc_1',
        question: 'What triggers the release of neurotransmitters into the synaptic cleft?',
        answer: 'Depolarization of the axon terminal activates voltage-gated Ca²⁺ channels, allowing calcium influx which triggers synaptic vesicles to fuse with the presynaptic membrane via SNARE proteins.',
        hint: 'Think of a divalent cation opening the gates for exocytosis.',
        keyConcept: 'Calcium Influx (Ca²⁺)',
        topicTag: 'Synaptic Transmission',
        status: 'mastered',
      },
      {
        id: 'fc_2',
        question: 'What is Long-Term Potentiation (LTP) and why is it crucial for learning?',
        answer: 'LTP is a persistent strengthening of synapses based on recent patterns of activity. High-frequency stimulation leads to increased AMPA receptor insertion and enhanced synaptic efficacy, serving as the cellular basis of memory.',
        hint: 'Hebb\'s postulate: "Neurons that fire together, wire together."',
        keyConcept: 'Long-Term Potentiation (LTP)',
        topicTag: 'Synaptic Plasticity',
        status: 'learning',
      },
      {
        id: 'fc_3',
        question: 'Why is the NMDA receptor often described as a "coincidence detector"?',
        answer: 'NMDA receptors require both glutamate binding AND postsynaptic membrane depolarization (which expels the blocking Mg²⁺ ion) before allowing Ca²⁺ to enter the neuron.',
        hint: 'It needs two conditions simultaneously: ligand binding + voltage clearance of Magnesium.',
        keyConcept: 'NMDA Receptor & Mg²⁺ Block',
        topicTag: 'Receptor Biology',
        status: 'learning',
      },
      {
        id: 'fc_4',
        question: 'What is the primary inhibitory neurotransmitter in the mature mammalian central nervous system?',
        answer: 'GABA (gamma-aminobutyric acid). Binding of GABA to GABA_A receptors causes chloride (Cl⁻) ion influx, hyperpolarizing the postsynaptic neuron and reducing the likelihood of an action potential.',
        hint: 'A four-letter acronym; binds to A and B type receptors.',
        keyConcept: 'GABA (Inhibition)',
        topicTag: 'Neurotransmitters',
        status: 'mastered',
      },
      {
        id: 'fc_5',
        question: 'What role does the hippocampus play in memory formation versus long-term storage?',
        answer: 'The hippocampus is essential for encoding and consolidating declarative memories (episodic and semantic) into the neocortex over time, but is not the permanent storage site for remote memories.',
        hint: 'Think of Patient H.M. who lost the ability to form new memories after bilateral medial temporal resection.',
        keyConcept: 'Systems Memory Consolidation',
        topicTag: 'Memory Systems',
        status: 'unseen',
      },
    ],
    quiz: [
      {
        id: 'qz_1',
        question: 'What critical ion must enter the presynaptic bouton to trigger synaptic vesicle fusion and neurotransmitter release?',
        options: ['Sodium (Na⁺)', 'Calcium (Ca²⁺)', 'Potassium (K⁺)', 'Chloride (Cl⁻)'],
        correctIndex: 1,
        explanation: 'Voltage-gated calcium channels open upon depolarization, and Ca²⁺ influx interacts with synaptotagmin on vesicles to induce membrane fusion.',
        topicTag: 'Synaptic Transmission',
        difficulty: 'medium',
      },
      {
        id: 'qz_2',
        question: 'Under resting membrane potential, what prevents ion flow through the pore of the NMDA receptor even when glutamate is bound?',
        options: [
          'Extracellular Magnesium (Mg²⁺) blockade',
          'Intracellular Calcium precipitation',
          'ATP depletion',
          'Sodium channel inactivation gate closure',
        ],
        correctIndex: 0,
        explanation: 'At negative resting potentials, a Mg²⁺ ion is electrostatically attracted into the channel vestibule, blocking ion flux until sufficient depolarization dislodges it.',
        topicTag: 'Receptor Biology',
        difficulty: 'hard',
      },
      {
        id: 'qz_3',
        question: 'Activation of ionotropic GABA_A receptors typically leads to which electrical event in a resting neuron?',
        options: [
          'Depolarization towards threshold (-50mV)',
          'Hyperpolarization via Cl⁻ influx',
          'Immediate bursting action potentials',
          'Irreversible sodium efflux',
        ],
        correctIndex: 1,
        explanation: 'GABA_A receptors are ligand-gated chloride channels. In mature neurons, the reversal potential for Cl⁻ is negative to resting potential, resulting in hyperpolarizing IPSPs.',
        topicTag: 'Neurotransmitters',
        difficulty: 'easy',
      },
      {
        id: 'qz_4',
        question: 'Which molecular modification is directly responsible for the early maintenance phase of LTP at CA1 dendritic spines?',
        options: [
          'Phosphorylation and insertion of AMPA receptors into the postsynaptic density',
          'Complete degradation of all NMDA receptors',
          'Immediate apoptosis of neighboring astrocytes',
          'Permanent closure of sodium-potassium pumps',
        ],
        correctIndex: 0,
        explanation: 'CaMKII activation by Ca²⁺ influx phosphorylates existing AMPA receptors to increase channel conductance and promotes exocytosis of additional AMPA receptors into the synaptic membrane.',
        topicTag: 'Synaptic Plasticity',
        difficulty: 'medium',
      },
    ],
  },
  {
    id: 'deck_sample_cs_ai',
    title: 'Computer Science: Transformer Architecture & Attention',
    summary: 'A structured breakdown of modern attention mechanisms, self-attention equations, positional encodings, multi-head projections, and feedforward blocks in transformer models.',
    keyTopics: ['Self-Attention', 'Query Key Value', 'Multi-Head Attention', 'Positional Encoding', 'Transformer'],
    estimatedStudyTimeMinutes: 15,
    sourceFileName: 'Attention_Is_All_You_Need_Summary.md',
    sourceFileSize: '850 KB',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    stats: {
      timesStudied: 1,
      bestQuizScore: 100,
      quizzesTaken: 1,
      lastStudiedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    flashcards: [
      {
        id: 'fc_cs_1',
        question: 'What is the mathematical formulation of Scaled Dot-Product Attention?',
        answer: 'Attention(Q, K, V) = softmax((Q * K^T) / sqrt(d_k)) * V, where Q, K, and V are Query, Key, and Value matrices, and d_k is the dimension of the keys.',
        hint: 'Softmax of scaled Q and K transpose multiplied by Values.',
        keyConcept: 'Scaled Dot-Product Attention',
        topicTag: 'Attention Mechanism',
        status: 'mastered',
      },
      {
        id: 'fc_cs_2',
        question: 'Why do Transformers divide the dot product Q * K^T by the square root of d_k?',
        answer: 'For large values of d_k, dot products grow large in magnitude, pushing the softmax function into regions with extremely small gradients (gradient vanishing). Scaling counters this effect.',
        hint: 'Prevents the softmax from saturating into near-zero gradients.',
        keyConcept: 'Softmax Scaling Factor',
        topicTag: 'Optimization & Gradients',
        status: 'mastered',
      },
      {
        id: 'fc_cs_3',
        question: 'Why is Positional Encoding required in Transformer architectures?',
        answer: 'Since the self-attention operation is permutation-invariant (it contains no recurrence or convolution to inherently register word order), positional encodings inject sequence order information into the input embeddings.',
        hint: 'Attention without position treats "dog bites man" identically to "man bites dog".',
        keyConcept: 'Positional Encoding',
        topicTag: 'Sequence Order',
        status: 'learning',
      },
      {
        id: 'fc_cs_4',
        question: 'What advantage does Multi-Head Attention provide over single-head attention?',
        answer: 'It allows the model to jointly attend to information from different representation subspaces at different positions, capturing distinct syntactic, semantic, and positional relationships simultaneously.',
        hint: 'Allows multiple independent focus points rather than averaging everything together.',
        keyConcept: 'Multi-Head Subspaces',
        topicTag: 'Architecture',
        status: 'unseen',
      },
    ],
    quiz: [
      {
        id: 'qz_cs_1',
        question: 'In Scaled Dot-Product Attention, what is the purpose of the sqrt(d_k) denominator?',
        options: [
          'To prevent the softmax function from saturating and producing vanishing gradients for high dimensional vectors',
          'To invert the direction of the attention vector',
          'To ensure the outputs sum to exactly zero',
          'To convert matrix multiplication into simple element-wise addition',
        ],
        correctIndex: 0,
        explanation: 'When d_k is large, dot products expand in variance, pushing softmax outputs to 0 or 1 where gradients are near zero.',
        topicTag: 'Attention Mechanism',
        difficulty: 'medium',
      },
      {
        id: 'qz_cs_2',
        question: 'Which property of the self-attention mechanism necessitates the use of positional encodings?',
        options: [
          'Permutation invariance with respect to token positions',
          'Quadratic computational time complexity',
          'Inability to process non-English characters',
          'Requirement for pre-training on GPU clusters',
        ],
        correctIndex: 0,
        explanation: 'Self-attention processes tokens as an unordered set of vectors. Without positional encodings, word order is completely lost.',
        topicTag: 'Sequence Order',
        difficulty: 'medium',
      },
    ],
  },
];

export const DEMO_PRESET_DOCUMENTS = [
  {
    title: 'Photosynthesis & Light-Dependent Reactions',
    category: 'Biology',
    description: 'Light energy absorption by chlorophyll, Photosystems II & I, electron transport chain, photophosphorylation, and the Calvin-Benson cycle.',
    sampleText: `Photosynthesis is the fundamental biological process that converts light energy into chemical energy stored in carbohydrates. The general balanced equation is: 6CO2 + 6H2O + light -> C6H12O6 + 6O2. 
Photosynthesis takes place in chloroplasts, specifically within the thylakoid membranes (light reactions) and the stroma (Calvin cycle).

The Light-Dependent Reactions:
1. Photosystem II (PSII / P680): Absorbs photons (primarily 680 nm), exciting electrons that are transferred to pheophytin and then the plastoquinone pool. Water photolysis occurs here: 2H2O -> 4H+ + 4e- + O2. This reaction replenishes electrons lost by P680 and releases oxygen into the atmosphere.
2. Cytochrome b6f Complex: Pumps protons across the thylakoid membrane from the stroma into the lumen, establishing an electrochemical proton gradient (proton motive force).
3. Photosystem I (PSI / P700): Absorbs light at 700 nm, exciting electrons that are transferred via ferredoxin to NADP+ reductase, reducing NADP+ to NADPH.
4. ATP Synthase: Uses the proton gradient across the thylakoid membrane (chemiosmosis) to synthesize ATP from ADP and inorganic phosphate.

The Calvin Cycle (Light-Independent Reactions):
Occurs in the stroma and consists of three main stages:
1. Carbon Fixation: The enzyme RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase) catalyzes the addition of CO2 to RuBP (a 5-carbon sugar), yielding an unstable 6-carbon intermediate that immediately splits into two molecules of 3-phosphoglycerate (3-PGA).
2. Reduction: ATP and NADPH from the light reactions are utilized to convert 3-PGA into glyceraldehyde-3-phosphate (G3P). For every 3 turns of the cycle (3 CO2 fixed), 1 net molecule of G3P exits to form glucose.
3. Regeneration of RuBP: The remaining 5 G3P molecules are rearranged using ATP to regenerate 3 RuBP molecules, allowing the cycle to repeat.`,
  },
  {
    title: 'Microeconomics: Supply, Demand & Market Equilibrium',
    category: 'Economics',
    description: 'Price elasticity, law of demand and supply, consumer and producer surplus, price ceilings/floors, and deadweight loss.',
    sampleText: `Fundamental Principles of Microeconomics:

The Law of Demand states that, ceteris paribus (all else being equal), as the price of a good increases, the quantity demanded decreases. This negative relationship is depicted by a downward-sloping demand curve. Factors causing a shift in demand (not quantity demanded) include consumer income, prices of related goods (substitutes and complements), tastes and preferences, expectations, and number of buyers.

The Law of Supply states that, ceteris paribus, as the price of a good increases, the quantity supplied increases, yielding an upward-sloping supply curve. Shifts in supply are caused by input prices (costs of production), technology, taxes and subsidies, expectations, and the number of sellers.

Market Equilibrium:
The point where the supply and demand curves intersect is the market equilibrium, determining the equilibrium price (P*) and equilibrium quantity (Q*). At this price, quantity demanded equals quantity supplied; there is neither a shortage (excess demand) nor a surplus (excess supply).

Price Elasticity of Demand (PED):
PED measures the responsiveness of quantity demanded to a percentage change in price:
PED = (% Change in Quantity Demanded) / (% Change in Price).
- Elastic demand: |PED| > 1 (consumers are highly responsive, such as luxury goods or goods with close substitutes).
- Inelastic demand: |PED| < 1 (consumers are relatively unresponsive, such as life-saving medication or essential utilities).
- Unit elastic: |PED| = 1.

Government Interventions & Efficiency:
1. Price Ceilings: A legal maximum price. If set below equilibrium, it creates a persistent shortage (e.g., rent control).
2. Price Floors: A legal minimum price. If set above equilibrium, it creates a persistent surplus (e.g., minimum wage or agricultural price supports).
3. Deadweight Loss: The reduction in total economic surplus (consumer surplus + producer surplus) that results from an inefficient market allocation, such as monopolistic pricing, taxes, or binding price controls.`,
  },
  {
    title: 'Operating Systems: Concurrency & Deadlocks',
    category: 'Computer Science',
    description: 'Process synchronization, mutex locks, semaphores, critical section problem, race conditions, and Coffman deadlock conditions.',
    sampleText: `Operating Systems: Concurrency, Synchronization, and Deadlocks

The Critical Section Problem:
When multiple concurrent processes or threads access shared resources (e.g., shared variables, files, memory), race conditions occur if the outcome depends on the non-deterministic order of execution.
To prevent race conditions, any synchronization solution for a critical section must satisfy three strict requirements:
1. Mutual Exclusion: If process P is executing in its critical section, no other processes can be executing in their critical sections.
2. Progress: If no process is executing in its critical section and some processes wish to enter, only those processes not in their remainder sections can participate in deciding who enters next, and this selection cannot be postponed indefinitely.
3. Bounded Waiting: There must be a bound on the number of times other processes are allowed to enter their critical sections after a process has made a request to enter and before that request is granted (preventing starvation).

Synchronization Primitives:
- Mutex Locks: Binary flags providing mutual exclusion through acquire() and release() methods. Can be spinlocks (busy-waiting) or blocking mutexes.
- Semaphores: An integer variable accessed only through wait() (or P()) and signal() (or V()). A counting semaphore can control access to a finite resource pool.
- Condition Variables: Synchronization construct allowing threads to suspend execution until a particular condition predicate becomes true.

Deadlocks:
A deadlock is a permanent state where every process in a set is waiting for an event that can only be caused by another process in the set.
The Four Coffman Conditions (All must hold simultaneously for a deadlock to occur):
1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.
2. Hold and Wait: A process must be holding at least one resource and waiting to acquire additional resources held by other processes.
3. No Preemption: Resources cannot be forcibly preempted from a process; they can only be released voluntarily.
4. Circular Wait: A closed chain of processes exists such that P0 waits for a resource held by P1, P1 waits for P2, ..., and Pn waits for P0.

Deadlock Handling Strategies:
- Prevention: Invalidate at least one of the four Coffman conditions (e.g., resource ordering to eliminate circular wait).
- Avoidance: Utilize algorithms like Dijkstra's Banker's Algorithm to verify that granting a resource request keeps the system in a guaranteed safe state.
- Detection and Recovery: Allow deadlocks to occur, periodically execute a cycle detection graph algorithm, and recover via process termination or resource preemption.
- Ostrich Algorithm: Ignore the problem if deadlocks are sufficiently rare (employed by many general-purpose OSs).`,
  },
];
