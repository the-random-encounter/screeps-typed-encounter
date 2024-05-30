// PURPOSE import creep role modules
import { roleHarvester, roleUpgrader, roleBuilder, roleFiller, roleRepairer, roleRunner, roleCrane, roleMiner, roleScientist, roleRanger, roleWarrior, roleHealer, roleProvider, roleRebooter, roleRemoteLogistician, roleRemoteHarvester, roleRemoteBuilder, roleRemoteGuard, roleReserver, roleClaimer, roleScout, roleInvader, roleCollector } from "roles/roles";

// PURPOSE import other modules
import { roomDefense } from "./roomDefense";
import { calcTickTime, visualRCProgress, buildProgress, log, returnCode } from 'prototypes/miscFunctions';
import { ErrorMapper } from "utils/ErrorMapper";
import { MemHack } from "utils/MemHack";
import { creepCleanup } from "room/cleanup";
import { RoomOfferTask, RoomPickupTask, RoomPullTask, RoomTask, RoomTransferTask, RoomWithdrawTask } from "room/roomTasks"
import { spawnVariants, constants, spawnPriorityList } from 'utils/constants';

// PURPOSE import prototype modules
import 'prototypes/creepFunctions';
import 'prototypes/roomFunctions';
import 'prototypes/roomPositionFunctions';
import 'prototypes/spawnFunctions';

// PURPOSE start of TypeScript interface & type declarations
declare global {

  // PURPOSE begin with TYPE definitions

	interface Colors {
		white: string
		lightGrey: string
		lightBlue: string
		darkBlue: string
		black: string
		yellow: string
		red: string
		green: string
		brown: string
	}

	type StampTypes =
	'fastFiller' 			|
	'hub'						  |
	'extensions' 			|
	'labs' 						|
	'tower' 					|
	'extension' 			|
	'observer' 				|
	'sourceLink' 			|
	'sourceExtension' |
	'rampart' 				|
	'boardingRampart'

	interface Stamp {
		offset: number
		/**
		 * The range of protection from the anchor to provide when deciding rampart placement
		 */
		protectionOffset: number
		size: number
		structures: {[structureType: string]: Pos[]}
	}

	type StampAnchors = Partial<Record<StampTypes, RoomPosition[]>>;

	type PackedPosMap = any[];

  type alignment = 'left' | 'right' | 'center';

  type OrderedStructurePlans = BuildObj[];

  type CreepRoles =
    'builder'           |
    'claimer'           |
    'filler'            |
    'collector'         |
    'crane'             |
    'harvester'         |
		'harvester1'				|
		'harvester2'				|
    'healer'            |
    'invader'           |
    'miner'             |
    'provider'          |
    'ranger'            |
    'rebooter'          |
    'remotebuilder'     |
    'remoteguard'       |
    'remoteharvester'   |
		'remoteharvester1'  |
		'remoteharvester2'  |
    'remotelogistician' |
    'remoterunner'      |
    'repairer'          |
    'reserver'          |
    'runner'            |
    'scientist'         |
    'scout'             |
    'upgrader'          |
    'warrior'           |
    'unallocated'


  type RoomObjectName =
    'terrainCM'         |
    'baseCM'            |
    'roadCM'            |
    'structurePlans'    |
    'mineral'           |
    'source1'           |
    'source2'           |
    'sources'           |
    'structuresByType'  |
    'cSitesByType'      |
    StructureConstant   |
    `${StructureConstant}CSite`   |
    'enemyCSites'                 |
    'allyCSites'                  |
    'mineralHarvestPositions'     |
    'closestMineralHarvestPos'    |
    'source1HarvestPositions'     |
    'source1ClosestHarvestPos'    |
    'source2HarvestPositions'     |
    'source2ClosestHarvestPos'    |
    'centerUpgraderPos'           |
    'upgradePositions'            |
    'fastFillerPositions'         |
    'source1Container'            |
    'source2Container'            |
    'controllerContainer'         |
    'mineralContainer'            |
    'fastFillerContainerLeft'     |
    'fastFillerContainerRight'    |
    'labContainer'                |
    'source1Link'                 |
    'source2Link'                 |
    'fastFillerLink'              |
    'hubLink'                     |
    'controllerLink'              |
    'usedMineralHarvestPositions' |
    'usedSourceHarvestPositions'  |
    'usedUpgradePositions'        |
    'usedFastFillerPositions'     |
    'structuresForSpawning'       |
    'notMyCreeps'                 |
    'enemyCreeps'                 |
    'allyCreeps'                  |
    'myDamagedCreeps'             |
    'damagedAllyCreeps'           |
    'remoteNamesByEfficacy'

  type RoomTaskTypes =
    'pull'      |
    'withdraw'  |
    'transfer'  |
    'pickup'    |
    'offer'

  type LogisticsPair = {
    source:       Id<StructureContainer | StructureStorage>;
    destination:  Id<StructureContainer | StructureStorage | StructureLink>;
    resource:     ResourceConstant;
    locality:     'local' | 'remote',
    descriptor:   string,
    distance?:    number,
  }

  type RoomFlag =
    'centralStorageLogic'   |
    'closestConSites'       |
    'craneUpgrades'         |
    'harvestersFixAdjacent' |
    'runnersDoMinerals'     |
    'runnersDoPiles'        |
    'repairBasics'          |
    'repairRamparts'        |
    'repairWalls'           |
    'sortConSites'          |
    'towerRepairBasic'      |
    'towerRepairDefenses'   |
    'upgradersSeekEnergy'   |
    'doScience'             |
    'boostCreeps'           |
    'dropHarvestingEnabled'

  type RoomName = `${'W' | 'E'}${number}${'N' | 'S'}${number}`

  type ReturnCode =
    'OK'                        |
    'ERR_NOT_OWNER'             |
    'ERR_NO_PATH'               |
    'ERR_NAME_EXISTS'           |
    'ERR_BUSY'                  |
    'ERR_NOT_FOUND'             |
    'ERR_NOT_ENOUGH_RESOURCES'  |
    'ERR_INVALID_TARGET'        |
    'ERR_FULL'                  |
    'ERR_NOT_IN_RANGE'          |
    'ERR_INVALID_ARGS'          |
    'ERR_TIRED'                 |
    'ERR_NO_BODYPART'           |
    'ERR_RCL_NOT_ENOUGH'        |
    'ERR_GCL_NOT_ENOUGH'

  // PURPOSE Begin TypeScript Interface implementations

  // * INTERFACES FOR IMPLEMENTING ADDITIONAL NATIVE GAME OBJECT PROTOTYPE FUNCTIONS
  interface Creep { // * ADDITIONAL CREEP OBJECT FUNCTIONS & PROPERTIES
    [key: string]:                                    any;
    findEnergySource():                               Source | false;
    AHS(no?: boolean):                                Source;
    assignHarvestSource(noIncrement?: boolean):       Source;
    assignRemoteHarvestSource(noIncrement?: boolean): Source;
    unloadEnergy():                                   void;
    harvestEnergy():                                  void;
    getDroppedResource(pileID: Id<Resource>):         void;
    pickupClosestEnergy():                            void;
    unloadMineral():                                  void;
    harvestMineral():                                 void;
    moveBySerializedPath(serializedPath: string):     void;
    recursivePathMove(serializedPath: string,
                      stepNum: number):               void;
    disable():                                        true;
    enable():                                         false;
    getBoost(compound: MineralCompoundConstant,
            sourceLab: Id<StructureLab>,
            numParts : number):                       boolean;
    assignOutbox(noIncrement?: boolean):              StructureContainer;
    assignInbox(noIncrement?: boolean):               StructureContainer;
    assignLogisticalPair(logParam?: number):          boolean;
    assignLogisticalPair():                           boolean;
    navigateWaypoints(waypoints: string | string[]):  void;
    targetPile(pileID: Id<Resource>):                 void;
		advGet(target: Source | Id<Source> | Mineral | Id<Mineral> | Deposit | Id<Deposit> | AnyStoreStructure | Resource | Tombstone | Ruin | Id<AnyStoreStructure> | Id<Resource> | Id<Tombstone> | Id<Ruin>, pathing?: MoveToOpts, resource?: ResourceConstant, canTravel?: boolean): ScreepsReturnCode;
		advGive(target: Creep | AnyStoreStructure | Id<AnyStoreStructure>, pathing?: MoveToOpts, resource?: ResourceConstant, canTravel?: boolean): ScreepsReturnCode
  }
  interface Room { // * ADDITIONAL ROOM OBJECT FUNCTIONS
		creepsOfSourceAmount: {[key: string]: number}

		/**
		 * An object with keys of roles with properties of arrays of creep names belonging to the role
		 */
		myCreeps: {[key: string]: string[]}

		/**
		 * The number of my creeps in the room
		 */
		myCreepsAmount: number

		roomObjects: Partial<Record<RoomObjectName, RoomObject>>

		/**
		 * An object with keys of roles and properties of the number of creeps with the role from this room
		 */
		creepsFromRoom: {[key: string]: string[]}

		/**
		 * The cumulative amount of creeps with a communeName value of this room's name
		 */
		creepsFromRoomAmount: number

		/**
		 * An object with keys of roles and properties of the number of creeps with the role from this room
		 */
		creepsFromRoomWithRemote: {[key: string]: {[key: string]: string[]}}

		/**
		 * Tasks that currently have a creep trying to fulfill them
		 */
		tasksWithResponders: {[key: string]: RoomTask}

		/**
		 * Tasks that don't currently have a responder
		 */
		tasksWithoutResponders: {[key: string]: RoomTask}

		/**
		 * An object, if constructed, containing keys of resource types and values of the number of those resources in the room's terminal and storage
		 */
		storedResources: {[key: string]: number}

		/**
		 * A matrix with indexes of packed positions and values of creep names
		 */
		creepPositions: PackedPosMap

		/**
		 * A matrix with indexes of packed positions and values of move requests
		 */
		moveRequests: PackedPosMap
		/**
		 * Uses caching and only operating on request to construct and get a specific roomObject based on its name
		 * @param roomObjectName The name of the requested roomObject
		 * @returns Either the roomObject's value, or, if the request failed, undefined
		*/
		get(roomObjectName: RoomObjectName): 							any | undefined
    RLP       ():                                     boolean;
    clearPPT  ():                                     void;
    enableCSL ():                                     void;
    disableCSL():                                     void;
    toggleCSL ():                                     void;
    setAttackRoom(roomName: string):                  void;
    setCustomAttackTarget(
      attackTarget: Id<Structure>):                   void;
    getInboxes():                                     Id<StructureContainer>[];
    getOutboxes():                                    Id<StructureContainer>[];
    setQuota(roleTarget:  CreepRoles,
             newTarget:   number    ):                void;
    cacheObjects():                                   void;
    initTargets(array:    number[]  ):                void;
    setTarget(roleTarget: CreepRoles,
              newTarget:  number    ):                void;
    sendEnergy():                                     void;
    initRoom():                                       void;
    initTargets(targetArray?: number[] |
                              false):                 void;
    initFlags():                                      void;
    setRoomFlags(flags: boolean[]):                   void;
    initSettings():                                   void;
		registerContainers():															boolean;
    registerLogisticalPairs():                        boolean;
    setRepairRampartsTo(percentMax:   number  ):      void;
    setRepairWallsTo(percentMax:      number  ):      void;
    setRoomSettings(repairToArray:    number[],
                    labSettingsArray: string[]):      void;
    setInbox(
      boxID: Id<StructureContainer>):                 void;
    setOutbox(
      boxID: Id<StructureContainer>):                 void;
    checkInbox(
      boxID: Id<StructureContainer>):                 boolean;
    checkOutbox(
      boxID: Id<StructureContainer>):                 boolean;
    enableFlag( flag:   string  ,
          initIfNull:   boolean):                     void;
    disableFlag(flag:   string  ,
          initIfNull:   boolean):                     void;
    toggleFlag( flag:   string  ,
          initIfNull:   boolean ,
        defaultValue:   boolean):                     void;
    clearRCLCounter():                                void;
    enableDisplayUpgradeRange():                      true;
    enableBoostCreeps(
      dontScience: boolean):                          void;
    toggleBoostCreeps(
      dontScience: boolean):                          void;
    disableBoostCreeps():                             void;
    enableCentralStorageLogic():                      void;
    enableCraneUpgrades():                            void;
    enableDoScience():                                void;
    enableTowerRepairBasic():                         void;
    enableTowerRepairDefenses():                      void;
    enableRunnersDoMinerals():                        void;
    enableRepairWalls():                              void;
    enableRepairRamparts():                           void;
    disableCentralStorageLogic():                     void;
    disableCraneUpgrades():                           void;
    disableDoScience():                               void;
    disableTowerRepairBasic():                        void;
    disableTowerRepairDefenses():                     void;
    disableRunnersDoMinerals():                       void;
    disableRepairWalls():

		                         void;
    toggleRunnersDoMinerals():                        void;
    toggleTowerRepairDefenses():                      void;
    toggleTowerRepairBasic():                         void;
    toggleDoScience():                                void;
    toggleCraneUpgrades():                            void;
    toggleCentralStorageLogic():                      void;
    toggleRepairWalls():                              void;
    disableRepairRamparts():                          void;
    toggleRepairRamparts():                           void;
    enableRepairBasics():                             void;
    disableRepairBasics():                            void;
    toggleRepairBasics():                             void;
    enableSortConSites():                             void;
    disableSortConSites():                            void;
    toggleSortConSites():                             void;
    calcLabReaction():                                MineralCompoundConstant;
    setSquad(squadName: string):                      void;
    setMusterPoint(
      squadName: string,
      posArray: number[],
      roomName: RoomName |
                false):                               void;
    registerOutpost(
      roomName: string |
                number):                              boolean;
    registerOutpostContainers(
      outpostName: string):                           void;
    calcOutpostPotential():                           void;
    registerLinks(): void;
    registerInvaderGroup(
      rallyPoint: string |
                  string[],
      targetRoom: RoomName,
      groupSize: number,
      groupRoles: string[]):                          void;
    setCraneSpot(
      posX: number,
      posY: number):                                  void;
    setRemoteTargets(
      roomName: RoomName,
      roomXY: number[],
      waypoints: string   |
                 string[] |
                 false,
      rbCount: number,
      rlCount: number,
      claimRoom: RoomName |
                 false,
      override: boolean):                             void;
    link():                                           void;
    findRemoteLinks():                                void;
    setCombatObjectives(
      attackRoom: RoomName,
      waypoints: string | string[],
      customTarget: Id<AnyStructure> |
                    Id<AnyStructure>[] |
                    false):                           boolean;
    setClaimObjective(
      roomName        : RoomName,
      logSpot         : number[],
      initialEnergy   : number,
      neededHarvester : number,
      neededBuilders  : number,
      waypoints       : string | string[]):           boolean;
		// Getters

		readonly global: Partial<RoomGlobal>

		_anchor: RoomPosition | undefined

		readonly anchor: RoomPosition | undefined

		readonly sourceHarvestPositions: SourceHarvestPositions

		_enemyCreeps: Creep[]

		readonly enemyCreeps: Creep[]

		_structures: Partial<OrganizedStructures>

		readonly structures: OrganizedStructures

		_cSites: Partial<Record<StructureConstant, ConstructionSite[]>>

		readonly cSites: Record<StructureConstant, ConstructionSite[]>

		readonly cSiteTarget: Id<ConstructionSite> | undefined

		_spawningStructures: SpawningStructures

		readonly spawningStructures: SpawningStructures

		_taskNeedingSpawningStructures: SpawningStructures

		readonly taskNeedingSpawningStructures: SpawningStructures

		_spawningStructuresByPriority: SpawningStructures

		readonly spawningStructuresByPriority: SpawningStructures
  }
  interface RoomPosition { // * ADDITIONAL ROOMPOSITION OBJECT FUNCTIONS
    getNearbyPositions():   Array<RoomPosition>;
    getOpenPositions():     Array<RoomPosition>;
    getNumOpenPositions():  number;
    link():                 string;
  }
  interface StructureSpawn { // * ADDITIONAL SPAWN STRUCTURE OBJECT FUNCTIONS
    spawnCollector(
      name: string,
      waypoints: string | string[] | 'none',
      maxEnergy?: number | false,
      iteration?: number):            ReturnCode;
    spawnHealer(
      creepName : string,
      targetRoom: RoomName,
      waypoints : string | string[] | 'none',
      maxEnergy : number | false):   ReturnCode;
    spawnBeef(
      creepName : string,
      targetRoom: RoomName,
      waypoints : string | string[] | 'none',
      maxEnergy : number | false):   ReturnCode;
    spawnWarrior(
      creepName : string,
      targetRoom: RoomName,
      waypoints : string | string[] | 'none',
      maxEnergy : number | false ):  ReturnCode;
    spawnNewClaimBuilder(
      targetRoom:  RoomName,
      name      :  string,
      maxEnergy?:  number,
      iteration?:  number       ):   ReturnCode;
    spawnNewClaimHarvester(
      targetRoom:  RoomName,
      name      :  string,
      maxEnergy?:  number,
      iteration?:  number       ):   ReturnCode;
    spawnNewClaimHauler(
      targetRoom:  RoomName,
      name      :  string,
      maxEnergy?:  number,
      iteration?:  number       ):   ReturnCode;
    spawnClaimer(
      claimRoom :  RoomName,
      name      :  string,
      canHaul   :  boolean,
      maxEnergy?:  number,
      iteration?:  number       ):   ReturnCode;
		spawnUpgrader(
			creepRole	: CreepRoles,
			maxEnergy?: number): ReturnCode;
    determineBodyparts(
      creepRole:  CreepRoles,
      maxEnergy?: number        ):   BodyPartConstant[];
  }

  // * INTERFACES FOR TOP LEVEL MEMORY OBJECTS (MEMORY, ROOM_MEMORY, CREEP_MEMORY)

  interface RawMemory {
    _parsed: any;
  }
  interface Memory {
    miscData?:          MiscData;
    constructed?:       true | undefined;
    roomVisuals?:       boolean;
    mapVisuals?:        boolean;
    cpuLogging?:        boolean;
    ID?:                number;
    colonies?:          Colonies;
    stats?:             Partial<Stats>;
    claimRequests?:     { [key: string]: { needs: number[], score: number } };
    attackRequests?:    { [key: string]: { needs: number[] } };
    constructionSites?: { [key: string]: number };
    globalSettings?:    { [key: string]: any };
    time?:              { [key: string]: any };
    matrices?:          { [key: string]: any };
  }
  interface CreepMemory {
    role:           CreepRoles;
    roleForQuota:   CreepRoles;
    homeRoom:       RoomName | string;
    working?:       boolean;
    rallyPoint?:    string | string[] | 'none';
    disableAI?:     boolean;
    pickup?:        Id<StructureContainer | StructureStorage | StructureLink>;
    dropoff?:       Id<StructureContainer | StructureStorage | StructureLink>;
    bucket?:        Id<StructureContainer | StructureStorage | StructureLink>;
    source?:        Id<Source>;
    mineral?:       Id<Mineral>;
    cargo?:         ResourceConstant;
    invaderLooter?: boolean;
    [key: string]:  any;
    link?:          Id<StructureLink>;
    atCraneSpot?:   boolean;
    upgrading?:     boolean;
    dropLink?:      boolean;
    storage?:       Id<StructureStorage>;
    terminal?:      Id<StructureTerminal>;
    destination?:   Id<StructureLink>;
    xferDest?:      boolean;
    customTarget?:  Id<AnyStructure>;
    savedPile?:     Id<Resource>;
  }

	interface SpawnMemory {
		spawnPriorityList:		CreepRoles[];
	}

	interface RoomGlobal {
		[key: string]: any

		// RoomObjects

		stampAnchors: StampAnchors

		sourceHarvestPositions: SourceHarvestPositions

		source1PathLength: number

		source2PathLength: number

		upgradePathLength: number

		tasksWithResponders: Record<string | number, RoomTask>

		tasksWithoutResponders: Record<string | number, RoomTask>

		plannedBase: boolean

		plannedRamparts: boolean
	}
  interface RoomMemory {
		/**
		 * A list of the efficacies of each source in the room
		*/
		sourceEfficacies: number[]
		/**
		 * A packed representation of the center of the fastFiller
		*/
		anchor: number

		/**
		 * A description of the room's defining properties that can be used to assume other properties
		*/
		type: string

		/**
		 * A set of names of remotes controlled by this room
		*/
		remotes: string[]

		/**
		 * If the room can be constructed by the base planner
		*/
		notClaimable: boolean

		source1: Id<Source>
		source2: Id<Source>

		/**
		 * A list of needs the remote wants met
		 */
		needs: number[]

		/**
		 * The room owner
		 */
		owner: string

		/**
		 * The controller's level
		 */
		level: number

		powerEnabled: boolean

		/**
		 * The number of towers in the room
		 */
		towers: number

		/**
		 * If a terminal is present in the room
		 */
		hasTerminal: boolean

		/**
		 * The amount of stored energy in the room
		 */
		storedEnergy: number

		/**
		 * A set of roomNames that portals in this room go to
		 */
		portalsTo: string[]

		/**
		 * The last tick the room was scouted at
		 */
		lastScout: number | undefined

		/**
		 * The room name of the commune's claim target
		 */
		claimRequest: string

		cSiteTargetID: Id<ConstructionSite>

		stampAnchors: Partial<Record<StampTypes, number[]>>

		abandoned: number | undefined
    targets:        { [key: string]: number };
    paths?:         { [key: string]: any };
    data:           RoomData;
    settings:       RoomSettings;
    objects:        RoomObjects;
    outposts:       Outposts;
    outpostOfRoom?: string;
  }

  // * INTERFACES FOR GAME MEMORY SUBOBJECTS
  interface Colonies {
    colonyList?:  string[];
    registry?:    { [key: string]: Colony };
  }
  interface Colony {
    ID?:        number;
    level?:     number;
    roomName?:  string;
    spawns?:    Array<string>;
    exitDirs?:  Array<string>;
    exitRooms?: Array<string>;
    outposts?:  { [key: string]: Outpost };
  }
  interface MiscData {
    [key: string]: any;
    rooms: { [key: string]: any };
  }
  interface GlobalSettings {
    consoleSpawnInterval: number;
    alertDisabled:        boolean;
    reusePathValue:       number;
    ignoreCreeps:         boolean,
    creepSettings: {
        [key: string]: {
        reusePathValue:   number;
        ignoreCreeps:     boolean;
      }
    };
  }

  // * INTERFACES FOR ROOM_MEMORY.SETTINGS OBJECT & SUBOBJECTS
  interface RoomSettings {
    containerSettings:  ContainerSettings;
    labSettings:        LabSettings;
    repairSettings:     RepairSettings;
    visualSettings:     VisualSettings;
    flags:              RoomFlags;
		upgraderMinEnergy: number;
  }
  interface ContainerSettings {
    inboxes?:     Id<StructureContainer>[];
    outboxes?:    Id<StructureContainer>[];
    lastInbox?:   number;
    lastOutbox?:  number;
  }
  interface LabSettings {
    reagentOne?:    MineralConstant | MineralCompoundConstant;
    reagentTwo?:    MineralConstant | MineralCompoundConstant;
    boostCompound?: MineralBoostConstant;
  }
  interface RoomFlags {
		boostUpgraders?:				boolean;
    centralStorageLogic?:   boolean;
    closestConSites?:       boolean;
    craneUpgrades?:         boolean;
    displayTowerRanges?:    boolean;
    harvestersFixAdjacent?: boolean;
    runnersDoMinerals?:     boolean;
    runnersDoPiles?:        boolean;
    repairBasics?:          boolean;
    repairRamparts?:        boolean;
    repairWalls?:           boolean;
    sortConSites?:          boolean;
    towerRepairBasic?:      boolean;
    towerRepairDefenses?:   boolean;
    upgradersSeekEnergy?:   boolean;
    doScience?:             boolean;
    boostCreeps?:           boolean;
    dropHarvestingEnabled?: boolean;
  }
  interface RepairSettings {
    repairRampartsTo?:  number;
    repairWallsTo?:     number;
  }
  interface VisualSettings {
    spawnInfo?:     SpawnInfoSettings;
    roomFlags?:     RoomFlagsSettings;
    progressInfo?:  ProgressInfoSettings;
    displayControllerUpgradeRange?: boolean;
    displayTowerRanges?:            boolean;
  }
  interface SpawnInfoSettings {
    alignment?: alignment;
    color?:     string;
    fontSize?:  number;
  }
  interface RoomFlagsSettings {
    displayCoords?: number[];
    color?:         string;
    fontSize?:      number;
  }
  interface ProgressInfoSettings {
    alignment?: alignment;
    xOffset?: number;
    yOffsetFactor?: number;
    stroke?: string;
    fontSize?: number;
    color?: string;
  }

  // * INTERFACES FOR ROOM_MEMORY.DATA OBJECT & SUBOBJECTS
  interface RoomData {
    craneSpot?:           number[];
    numCSites?:           number;
    upgraderBucket?:      Id<StructureContainer | StructureStorage | StructureLink>;
    linkRegistry?:        LinkRegistry;
    logisticalPairs?:     LogisticsPair[];
    customAttackTarget?:  Id<AnyStructure>;
    attackRoom?:          RoomName;
    noPairs?:             boolean;
    pairCounter?:         number;
    pairPaths?:           any[];
    remoteWorkRoom?:      RoomName;
    claimRooms?:          { [key: RoomName]: ClaimRoomObjective };
    remoteLogistics?:     { [key: RoomName]: RemoteLogistics };
    squads?:              string[];
    combatObjectives?:    CombatObjective;
    towerLRT?:            Id<AnyStructure>;
    attackSignal?:        boolean;
    controllerAttack?:    Id<StructureController>;
  }
  interface ClaimRoomObjective {
    roomName: RoomName;
    logSpot:  Pos;
    initialEnergy: number;
    energyRemaining: number;
    neededHarvesters: number;
    neededBuilders: number;
    waypoints?: string | string[];
    hasBeenClaimed: boolean;
    claimerSpawned: boolean;
  }
  interface CombatObjective {
    attackRoom?:          RoomName;
    customAttackTargets?: Id<AnyStructure> | Id<AnyStructure>[] | false;
    squads?:              string[];
    waypoints?:           string | string[];
    invaderGroupSize?:    number;
    musterPoint?:         RoomPosition;
  }
  interface RemoteLogistics {
    roomName:                 RoomName;
    desiredBuilderCount:      number;
    desiredLogisticianCount:  number;
    waypoints?:               string | string[];
    logisticsTarget:          number[];
  }
  interface LinkRegistry {
    sourceOne?:     Id<StructureLink>;
    sourceTwo?:     Id<StructureLink>;
    central?:       Id<StructureLink>;
    destination?:   Id<StructureLink>;
    remotes?:       Id<StructureLink>[];
  }
  interface Outposts {
    roomList?:                string[];
    registry?:                { [key: string]: Outpost };
    aggregateSourceList?:     Array<Id<Source>>;
    aggLastAssigned?:         number;
    aggregateContainerList?:  Array<Id<StructureContainer>>;
    aggLastContainer?:        number;
  }
  interface Outpost {
    name:         string;
    homeRoom:     string;
    controller:   Id<StructureController>;
    containers?:  Array<Id<StructureContainer>>;
    sources:      Array<Id<Source>>;
    mineral?:     Id<Mineral>;
    lastAssigned: number;
    direction:    DirectionConstant;
    rallyPoint?:  string | string[];
  }
  interface RoomObjects {
    sources?:       Id<Source>[];
    mineral?:       Id<Mineral>;
    deposit?:       Id<Deposit>;
    controller?:    Id<StructureController>;
    containers?:    Id<StructureContainer>[];
    spawns?:        Id<StructureSpawn>[];
    extensions?:    Id<StructureExtension>[];
    towers?:        Id<StructureTower>[];
    storage?:       Id<StructureStorage>;
    links?:         Id<StructureLink>[];
    extractor?:     Id<StructureExtractor>;
    terminal?:      Id<StructureTerminal>;
    labs?:          Id<StructureLab>[];
    factory?:       Id<StructureFactory>;
    observer?:      Id<StructureObserver>;
    nuker?:         Id<StructureNuker>;
    powerSpawn?:    Id<StructurePowerSpawn>;
    walls?:         Id<StructureWall>[];
    ramparts?:      Id<StructureRampart>[];
    keeperLairs?:   Id<StructureKeeperLair>[];
    invaderCores?:  Id<StructureInvaderCore>[];
    powerBanks?:    Id<StructurePowerBank>[];
    portals?:       Id<StructurePortal>[];
    lastAssigned?:  number;
  }

  // * GENERAL INTERFACES, NOT COMPLETELY IMPLEMENTED YET
  export interface Coord {
    x: number;
    y: number;
  }

  interface Pos {
    x: number
    y: number
  }

  interface Rect {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }

  interface Colors {
    white:      string
    lightGrey:  string
    lightBlue:  string
    darkBlue:   string
    black:      string
    yellow:     string
    red:        string
    green:      string
    brown:      string
  }
  interface PathGoal {
    pos:    RoomPosition;
    range:  number
  }

  interface PathOpts {
    origin:       RoomPosition
    goal:         PathGoal
    typeWeights?: { [key: string]: number }
    plainCost?:   number
    swampCost?:   number
    maxRooms?:    number
    flee?:        boolean
    creep?:       Creep

    weightStructures?: { [key: string]: number }

    /*
     * An object with keys of weights and values of structures / creeps / cSites to weight
     */
    weightGameObjects?: { [key: string]: (Structure | Creep | ConstructionSite)[] }

    /*
     * An object with keys of weights and values of positions
     */
    weightPositions?: { [key: string]: Pos[] }
    weightCostMatrixes?: CostMatrix[]
    avoidEnemyRanges?: boolean
    avoidStationaryPositions?: boolean
    /*
     * Weight my ramparts by this value
     */
    myRampartWeight?: number
  }
  interface FindClosestPosOfValueOpts {
    CM:                 CostMatrix,
    startPos:           Pos
    requiredValue:      number
    reduceIterations?:  number
    initialWeight?:     number
    adjacentToRoads?:   boolean
    roadCM?:            CostMatrix
  }

  interface MoveRequestOpts extends PathOpts {
    cacheAmount?: number
  }

  interface BuildObj {
    structureType: BuildableStructureConstant
    x: number
    y: number
  }

  interface SpawnRequestOpts {
    defaultParts:     BodyPartConstant[]
    extraParts:       BodyPartConstant[]
    partsMultiplier:  number
    minCost:          number
    priority:         number
    memoryAdditions:  Partial<CreepMemory>
    groupComparator?: string[]
    threshold?:       number
    minCreeps?:       number | undefined
    maxCreeps?:       number | undefined
    maxCostPerCreep?: number | undefined
  }

  interface ExtraOpts {
    memory: CreepMemory
    energyStructures: (
            StructureSpawn |
            StructureExtension)[]
    dryRun: boolean
  }

  interface SpawnRequest {
    body:       BodyPartConstant[]
    tier:       number
    cost:       number
    extraOpts:  ExtraOpts
  }

  interface Stats {

    bases: number
    credits: number
    energy: number // * The amount of energy in storages and terminals in owned rooms
    boosts: { [key: string]: MineralBoostConstant } // * An object of boosts representing the amount of each boost in storages and terminals in owned rooms
    cpuUsage:     number
    cpuLimit:     number
    cpuBucket:    number
    memoryUsage:  number
    memoryLimit:  number

    GCLPercent:   number
    totalGCL:     number
    GCLLevel:     number
    GPLPercent:   number
    totalGPL:     number
    GPLLevel:     number

    creeps:                     number // * The total number of creeps the bot owns
    powerCreepCount:            number
    energyHarvested:            number // * The total amount of energy harvested by the bot per tick
    mineralsHarvested:          number
    controlPoints:              number
    energySpentOnCreeps:        number
    energySpentOnConstruction:  number
    energySpentOnRepairing:     number
    energySpentOnBarricades:    number
  }
  interface OrganizedStructures {
    spawn:            StructureSpawn[]
    extension:        StructureExtension[]
    road:             StructureRoad[]
    constructedWall:  StructureWall[]
    rampart:          StructureRampart[]
    keeperLair:       StructureKeeperLair[]
    portal:           StructurePortal[]
    controller:       StructureController[]
    link:             StructureLink[]
    storage:          StructureStorage[]
    tower:            StructureTower[]
    observer:         StructureObserver[]
    powerBank:        StructurePowerBank[]
    powerSpawn:       StructurePowerSpawn[]
    extractor:        StructureExtractor[]
    lab:              StructureLab[]
    terminal:         StructureTerminal[]
    container:        StructureContainer[]
    nuker:            StructureNuker[]
    factory:          StructureFactory[]
    invaderCore:      StructureInvaderCore[]
  }

	type SpawningStructures = (StructureSpawn | StructureExtension)[]

	type SourceHarvestPositions = Map<number, boolean>[]


  namespace NodeJS {
    interface Global {
      [key: string | number]: any;
      logs: string;
      cSiteCount: number;
      killAllCreeps(): string;
      destroyAllCSites(types: StructureConstant[]): string;
      calcTickTime(): void;
      roomDefense(room: Room): void;
      calcPath(): Array<PathFinderPath | number>;
      visualRCProgress(controllerID: StructureController): void;
      GOBI(ID: Id<AnyCreep | AnyStructure | ConstructionSite | Resource | Tombstone>): AnyCreep | AnyStructure | ConstructionSite | Resource | Tombstone;
      MC(name: string, dir: DirectionConstant): CreepMoveReturnCode;
      createRoomFlag(room: string): string | null;
      validateRoomName(roomName: string): roomName is RoomName;
      entries<K extends string, V extends {}>(obj: Partial<Record<K, V>>): [K, V][];
      keys<K extends string>(obj: Record<K, unknown>): K[];
    }
  }
}

// PURPOSE define pre-configured creep bodypart arrays as key/value pairs in an object


// PURPOSE declare creep counting integers for spawning purposes
let creepRoleCounts: {[key: string]: any} = {
	builder: 1,
	claimer: 1,
	filler: 1,
	collector: 1,
	crane: 1,
	harvester: 1,
	healer: 1,
	invader: 1,
	miner: 1,
	provider: 1,
	ranger: 1,
	rebooter: 1,
	repairer: 1,
	reserver: 1,
	runner: 1,
	scientist: 1,
	scout: 1,
	upgrader: 1,
	warrior: 1,
	remoteBuilder: 1,
	remoteGuard: 1,
	remoteHarvester: 1,
	remoteLogistician: 1,
}

// PURPOSE declare other global variables
let tickCount:            number  = 0;
let newName:              string  = '';
let spawnAnnounced:       boolean = false;
let harvesterDying:       boolean = false;
let runnerDying:          boolean = false;
let reserverDying:        boolean = false;
let fillerDying:          boolean = false;
let remoteHarvesterDying: boolean = false;
let remoteGuardDying:     boolean = false;
let minerDying:           boolean = false;

// PURPOSE initialize top level Memory objects if needed
if (Memory.miscData === undefined)
  Memory.miscData = {
  'containerCounter':     0,
  'outpostRoomCounter':   0,
  'outpostSourceCounter': 0,
  'outpostCounterRv':     0,
  'outpostCounterRG':     0,
  'rooms': {
    'W5N43': {}
    }
  };

if (Memory.globalSettings === undefined || Memory.globalSettings.creepSettings === undefined) {
  const globalSettings: GlobalSettings = {
    consoleSpawnInterval: 25,
    alertDisabled: true,
    reusePathValue: 5,
    ignoreCreeps: true,
    creepSettings: {
      builder: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      claimer: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      filler: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      crane: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      harvester: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      healer: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      invader: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      miner: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      provider: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      ranger: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      rebooter: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      remotebuilder: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      remoteguard: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      remoteharvester: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      remotelogistician: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      remoterunner: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      repairer: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      reserver: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      runner: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      scientist: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      scout: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      upgrader: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      warrior: {
        reusePathValue: 3,
        ignoreCreeps: true
      }
    }
  };
  Memory.globalSettings = globalSettings;
}

if (Memory.colonies === undefined) {
  const colonies: Colonies = { colonyList: [], registry: {} };
  Memory.colonies = colonies;
}

//*  When compiling TS to JS and bundling with rollup,
//*  the line numbers and file names in error messages change
//*  Use the ErrorMapper.wrapLoop() to sync the error changes.
//*  Use the regular version on the above line otherwise.
// ? NORMAL VERSION:
// ex> export const loop = function() {
// ? ERRORMAPPER VERSION:
export const loop = ErrorMapper.wrapLoop(() => {
  //: This is code to run in the main loop, just once each tick, separate from any room loops

  MemHack.pretick();

  if (typeof Memory.colonies === undefined) Memory.colonies = {};
  if (typeof Memory.colonies.colonyList === undefined) Memory.colonies.colonyList = [];
  if (Memory.globalSettings === undefined) {
    Memory.globalSettings = {};
    Memory.globalSettings.consoleSpawnInterval = 10;
  }

  calcTickTime();

  // PURPOSE Generate pixels with extra CPU time
  if (Game.shard.name === 'shard3') {
    if (Game.cpu.bucket == 10000) {
      Game.cpu.generatePixel()
      console.log('[GENERAL]: CPU Bucket at limit, generating pixel...');
    }
  }

  // PURPOSE Remove creeps from Memory after they die
	creepCleanup(creepRoleCounts);

	//: EXECUTE CREEP ACTIONS BY ROLE EACH TICK
	for(let name in Game.creeps) {
    const creep = Game.creeps[name];

    switch (creep.memory.role) {

      //* LOCAL COLONY ROLES
      case 'harvester':
      	roleHarvester .run(creep);
        break;
      case 'collector':
       roleCollector.run (creep);
        break;
      case 'filler':
        roleFiller .run(creep);
        break;
      case 'runner':
       roleRunner    .run(creep);
        break;
      case 'builder':
        roleBuilder   .run(creep);
        break;
      case 'filler':
        roleFiller    .run(creep);
        break;
      case 'upgrader':
        roleUpgrader  .run(creep);
        break;
      case 'repairer':
        roleRepairer  .run(creep);
        break;
      case 'crane':
        roleCrane     .run(creep);
        break;
      case 'miner':
        roleMiner     .run(creep);
        break;
      case 'scientist':
        roleScientist .run(creep);
        break;

      //* REMOTE/OUTPOST ROLES
      case 'remotelogistician':
        roleRemoteLogistician .run(creep);
        break;
      case 'remoteharvester':
        roleRemoteHarvester   .run(creep);
        break;
      case 'remotebuilder':
      //  roleRemoteBuilder     .run(creep);
        break;
      case 'remoteguard':
        roleRemoteGuard       .run(creep);
        break;

      //* SPECIAL USE ROLES
      case 'reserver':
        roleReserver.run(creep);
        break;
      case 'rebooter':
        roleRebooter.run(creep);
        break;
      case 'claimer':
        roleClaimer .run(creep);
        break;
      case 'provider':
        roleProvider.run(creep);
        break;
      case 'scout':
        roleScout   .run(creep);
        break;

      //* COMBAT ROLES
      case 'ranger':
        roleRanger  .run(creep);
        break;
      case 'warrior':
        roleWarrior .run(creep);
        break;
      case 'healer':
        roleHealer  .run(creep);
        break;
      case 'invader':
        roleInvader .run(creep);
        break;
    }
  }

  //: main code loop to run inside each room containing our units/structures
  _.forEach(Game.rooms, function (room: Room) {

    const rMem = room.memory;

    if (!rMem.objects) {
      console.log(room.link() + 'No room objects in memory. Caching.')
      room.cacheObjects();
    }

    if (!rMem.settings) {
      room.initSettings();
      room.initFlags();
    }

    if (Memory.miscData.rooms[room.name] === undefined)
      Memory.miscData.rooms[room.name] = {};

    const cSites: Array<ConstructionSite> = room.find(FIND_CONSTRUCTION_SITES, { filter: (i) => i.structureType !== STRUCTURE_ROAD})
    const numCSitesPrevious: number = rMem.data.numCSites || 0;
    rMem.data.numCSites = cSites.length;
    const numCSites: number = rMem.data.numCSites;

    if (numCSites < numCSitesPrevious) {
      room.cacheObjects();
      if (rMem.outpostOfRoom) {
        const outpostContainers: Id<StructureContainer>[] = rMem.objects.containers;
        const outpostAggregateContainerList: Id<StructureContainer>[] = Game.rooms[rMem.outpostOfRoom].memory.outposts.aggregateContainerList;

        const missingContainers: Id<StructureContainer>[] = outpostAggregateContainerList.filter(containerId => !outpostContainers.includes(containerId));
      }
    }

    _.forEach(cSites, function (cSite: ConstructionSite) {
      if (cSite.progress > 0) buildProgress(cSite, room);
    });

    //: FOR ROOMS OWNED BY BOT ===========================================================================================================
    if (room && room.controller && room.controller.my) {

      const data:     RoomData     = rMem.data;
      const objects:  RoomObjects  = rMem.objects;
      const settings: RoomSettings = rMem.settings;
      const flags:    RoomFlags    = rMem.settings.flags;
      const colonies: Colonies     = Memory.colonies;

      if (tickCount > 0 && tickCount % 1000 == 0) {
        log('MAIN LOOP, CACHING OBJECTS EVERY 1000 TICKS --- Tick#: ' + tickCount, room);
        room.cacheObjects();
      }

      if (Memory.colonies.registry[room.name] === undefined) {
        Memory.colonies.registry[room.name] = {};
        let colonyListArray: string[] = Memory.colonies.colonyList || [];
        colonyListArray.push(room.name);
        Memory.colonies.colonyList = colonyListArray;
        Memory.colonies.registry[room.name].ID        = Memory.colonies.colonyList.length;
        Memory.colonies.registry[room.name].level     = room.controller.level;
        Memory.colonies.registry[room.name].spawns    = [];
        Memory.colonies.registry[room.name].exitDirs  = Object.keys(Game.map.describeExits(room.name));
        Memory.colonies.registry[room.name].exitRooms = Object.values(Game.map.describeExits(room.name));
        Memory.colonies.registry[room.name].outposts  = {};
      }

      if (room.controller.level !== Memory.colonies.registry[room.name].level)
        Memory.colonies.registry[room.name].level = room.controller.level;

      const roomSpawns:    StructureSpawn[] = room.find(FIND_MY_SPAWNS);
      let roomSpawnsNames: string[] = [];
      for (let i = 0; i < roomSpawns.length; i++)
        roomSpawnsNames.push(roomSpawns[i].name);
      if (Memory.colonies.registry[room.name].spawns.length < roomSpawnsNames.length)
        Memory.colonies.registry[room.name].spawns = roomSpawnsNames;

      if (!rMem.data.upgraderBucket) {
        const upgraderBucket: Array<StructureContainer | StructureStorage | StructureLink> = room.controller.pos.findInRange(FIND_STRUCTURES, 5, { filter: (i) => i.structureType == STRUCTURE_CONTAINER || i.structureType == STRUCTURE_STORAGE || i.structureType == STRUCTURE_LINK });

        if (upgraderBucket.length > 0)
          rMem.data.upgraderBucket = upgraderBucket[0].id;
      }

      if (rMem.settings.visualSettings.displayControllerUpgradeRange) {
        room.visual.circle(room.controller.pos, {fill: '#002200', radius: 4, stroke: '#00aa00', strokeWidth: 0.1, opacity: 0.5, lineStyle: 'dashed'})
      }

      const roomName: string = room.name;

      if (!rMem.objects       ) room.cacheObjects();
      if (!rMem.settings      ) room.initSettings();
      if (!rMem.settings.flags) room.initFlags();
      if (!rMem.targets       ) room.initTargets();

      let spawn: StructureSpawn;
      if (rMem.objects.spawns && rMem.objects.spawns.length)
        spawn = Game.getObjectById(rMem.objects.spawns[0]);

      // PURPOSE tower logic function
      roomDefense(room);

      //: SPAWN VARIANT ALLOCATION

      // PURPOSE define working variant set for use in the main loop, assigned based on current energy capacity limits
      let availableVariants:{[key: string]: {body: BodyPartConstant[], cost: number}} = {
        harvester:  { body: [], cost: 0},
        filler:     { body: [], cost: 0},
        upgrader:   { body: [], cost: 0},
        builder:    { body: [], cost: 0},
        repairer:   { body: [], cost: 0},
        runner:     { body: [], cost: 0},
        warrior:    { body: [], cost: 0},
        crane:      { body: [], cost: 0},
        remoteGuard:{ body: [], cost: 0},
        remoteLogi: { body: [], cost: 0},
        reserver:   { body: [], cost: 0},
        healer:     { body: [], cost: 0},
        ranger:     { body: [], cost: 0},
        beast:      { body: [], cost: 0},
        pony:       { body: [], cost: 0},
        beef:       { body: [], cost: 0},
        dHarvester: { body: [], cost: 0}
      }

      if (room.energyCapacityAvailable >= 1800) {
        availableVariants.dHarvester.body     = spawnVariants.dHarvester650;
        availableVariants.dHarvester.cost     = 650
        availableVariants.harvester.body      = spawnVariants.harvester700;
        availableVariants.harvester.cost      = 700;
        availableVariants.filler.body         = spawnVariants.filler800;
        availableVariants.filler.cost         = 800;
        availableVariants.upgrader.body       = spawnVariants.upgrader1400;
        availableVariants.upgrader.cost       = 900;
        availableVariants.builder.body        = spawnVariants.builder1100;
        availableVariants.builder.cost        = 1100;
        availableVariants.repairer.body       = spawnVariants.repairer1000;
        availableVariants.repairer.cost       = 1000;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
        availableVariants.remoteGuard.body    = spawnVariants.remoteGuard700;
        availableVariants.remoteGuard.cost    = 700;
        availableVariants.warrior.body        = spawnVariants.warrior1800;
        availableVariants.warrior.cost        = 1800;
        availableVariants.ranger.body         = spawnVariants.ranger1800;
        availableVariants.ranger.cost         = 1800;
        availableVariants.healer.body         = spawnVariants.healer1800;
        availableVariants.healer.cost         = 1800;
        availableVariants.remoteLogi.body     = spawnVariants.remoteLogi1500;
        availableVariants.remoteLogi.cost     = 1500;
        availableVariants.reserver.body       = spawnVariants.reserver1300;
        availableVariants.reserver.cost       = 1300;
      }  else if (room.energyCapacityAvailable >= 1400) {
        availableVariants.dHarvester.body     = spawnVariants.dHarvester650;
        availableVariants.dHarvester.cost     = 650
        availableVariants.harvester.body      = spawnVariants.harvester700;
        availableVariants.harvester.cost      = 700;
        availableVariants.filler.body         = spawnVariants.filler800;
        availableVariants.filler.cost         = 800;
        availableVariants.upgrader.body       = spawnVariants.upgrader900;
        availableVariants.upgrader.cost       = 900;
        availableVariants.builder.body        = spawnVariants.builder1100;
        availableVariants.builder.cost        = 1100;
        availableVariants.repairer.body       = spawnVariants.repairer1000;
        availableVariants.repairer.cost       = 1000;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
        availableVariants.remoteGuard.body    = spawnVariants.remoteGuard700;
        availableVariants.remoteGuard.cost    = 700;
        availableVariants.warrior.body        = spawnVariants.warrior1400;
        availableVariants.warrior.cost        = 1400;
        availableVariants.healer.body         = spawnVariants.healer1200;
        availableVariants.healer.cost         = 1200;
        availableVariants.remoteLogi.body     = spawnVariants.remoteLogi1500;
        availableVariants.remoteLogi.cost     = 1500;
        availableVariants.reserver.body       = spawnVariants.reserver1300;
        availableVariants.reserver.cost       = 1300;
			} else if (room.energyCapacityAvailable >= 1300) {
        availableVariants.dHarvester.body     = spawnVariants.dHarvester650;
        availableVariants.dHarvester.cost     = 650
        availableVariants.harvester.body      = spawnVariants.harvester700;
        availableVariants.harvester.cost      = 700;
        availableVariants.filler.body         = spawnVariants.filler800;
        availableVariants.filler.cost         = 800;
        availableVariants.upgrader.body       = spawnVariants.upgrader700;
        availableVariants.upgrader.cost       = 700;
        availableVariants.builder.body        = spawnVariants.builder1000;
        availableVariants.builder.cost        = 1000;
        availableVariants.repairer.body       = spawnVariants.repairer1000;
        availableVariants.repairer.cost       = 1000;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
        availableVariants.remoteGuard.body    = spawnVariants.remoteGuard700;
        availableVariants.remoteGuard.cost    = 700;
        availableVariants.remoteLogi.body     = spawnVariants.remoteLogi1200;
        availableVariants.remoteLogi.cost     = 1200;
        availableVariants.reserver.body       = spawnVariants.reserver1300;
        availableVariants.reserver.cost       = 1300;
      } else if (room.energyCapacityAvailable >= 1250) {
        availableVariants.dHarvester.body     = spawnVariants.dHarvester650;
        availableVariants.dHarvester.cost     = 650
        availableVariants.harvester.body      = spawnVariants.harvester700;
        availableVariants.harvester.cost      = 700;
        availableVariants.filler.body         = spawnVariants.filler500;
        availableVariants.filler.cost         = 500;
        availableVariants.upgrader.body       = spawnVariants.upgrader700;
        availableVariants.upgrader.cost       = 700;
        availableVariants.builder.body        = spawnVariants.builder800;
        availableVariants.builder.cost        = 800;
        availableVariants.repairer.body       = spawnVariants.repairer800;
        availableVariants.repairer.cost       = 800;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
        availableVariants.remoteGuard.body    = spawnVariants.remoteGuard700;
        availableVariants.remoteGuard.cost    = 700;
        availableVariants.reserver.body       = spawnVariants.reserver650;
        availableVariants.reserver.cost       = 650;
			} else if (room.energyCapacityAvailable >= 1000) {
        availableVariants.dHarvester.body     = spawnVariants.dHarvester650;
        availableVariants.dHarvester.cost     = 650
        availableVariants.harvester.body      = spawnVariants.harvester700;
        availableVariants.harvester.cost      = 700;
        availableVariants.filler.body         = spawnVariants.filler500;
        availableVariants.filler.cost         = 500;
        availableVariants.upgrader.body       = spawnVariants.upgrader700;
        availableVariants.upgrader.cost       = 700;
        availableVariants.builder.body        = spawnVariants.builder800;
        availableVariants.builder.cost        = 800;
        availableVariants.repairer.body       = spawnVariants.repairer800;
        availableVariants.repairer.cost       = 800;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
        availableVariants.remoteGuard.body    = spawnVariants.remoteGuard700;
        availableVariants.remoteGuard.cost    = 700;
        availableVariants.reserver.body       = spawnVariants.reserver650;
        availableVariants.reserver.cost       = 650;
			} else if (room.energyCapacityAvailable >= 900) {
        availableVariants.dHarvester.body     = spawnVariants.dHarvester650;
        availableVariants.dHarvester.cost     = 650
        availableVariants.harvester.body      = spawnVariants.harvester700;
        availableVariants.harvester.cost      = 700;
        availableVariants.filler.body         = spawnVariants.filler500;
        availableVariants.filler.cost         = 500;
        availableVariants.upgrader.body       = spawnVariants.upgrader800;
        availableVariants.upgrader.cost       = 800;
        availableVariants.builder.body        = spawnVariants.builder700;
        availableVariants.builder.cost        = 700;
        availableVariants.repairer.body       = spawnVariants.repairer600;
        availableVariants.repairer.cost       = 600;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
        availableVariants.remoteGuard.body    = spawnVariants.remoteGuard700;
        availableVariants.remoteGuard.cost    = 700;
        availableVariants.reserver.body       = spawnVariants.reserver650;
        availableVariants.reserver.cost       = 650;
			} else if (room.energyCapacityAvailable >= 800) {
        availableVariants.dHarvester.body     = spawnVariants.dHarvester650;
        availableVariants.dHarvester.cost     = 650
        availableVariants.harvester.body      = spawnVariants.harvester600;
        availableVariants.harvester.cost      = 600;
        availableVariants.filler.body         = spawnVariants.filler500;
        availableVariants.filler.cost         = 500;
        availableVariants.upgrader.body       = spawnVariants.upgrader700;
        availableVariants.upgrader.cost       = 700;
        availableVariants.builder.body        = spawnVariants.builder600;
        availableVariants.builder.cost        = 600;
        availableVariants.repairer.body       = spawnVariants.repairer500;
        availableVariants.repairer.cost       = 500;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
        availableVariants.remoteGuard.body    = spawnVariants.remoteGuard700;
        availableVariants.remoteGuard.cost    = 700;
        availableVariants.reserver.body       = spawnVariants.reserver650;
        availableVariants.reserver.cost       = 650;
			} else if (room.energyCapacityAvailable >= 700) {
        availableVariants.dHarvester.body     = spawnVariants.dHarvester600;
        availableVariants.dHarvester.cost     = 600
        availableVariants.harvester.body      = spawnVariants.harvester550;
        availableVariants.harvester.cost      = 550;
        availableVariants.filler.body         = spawnVariants.filler500;
        availableVariants.filler.cost         = 500;
        availableVariants.upgrader.body       = spawnVariants.upgrader550;
        availableVariants.upgrader.cost       = 550;
        availableVariants.builder.body        = spawnVariants.builder600;
        availableVariants.builder.cost        = 600;
        availableVariants.repairer.body       = spawnVariants.repairer500;
        availableVariants.repairer.cost       = 500;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
        availableVariants.remoteGuard.body    = spawnVariants.remoteGuard700;
        availableVariants.remoteGuard.cost    = 700;
			} else if (room.energyCapacityAvailable >= 600) {
        availableVariants.dHarvester.body     = spawnVariants.dHarvester550;
        availableVariants.dHarvester.cost     = 550
        availableVariants.harvester.body      = spawnVariants.harvester500;
        availableVariants.harvester.cost      = 500;
        availableVariants.filler.body         = spawnVariants.filler300;
        availableVariants.filler.cost         = 300;
        availableVariants.upgrader.body       = spawnVariants.upgrader550;
        availableVariants.upgrader.cost       = 550;
        availableVariants.builder.body        = spawnVariants.builder500;
        availableVariants.builder.cost        = 500;
        availableVariants.repairer.body       = spawnVariants.repairer500;
        availableVariants.repairer.cost       = 500;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.warrior.body        = spawnVariants.warrior520;
        availableVariants.warrior.cost        = 520;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
			} else if (room.energyCapacityAvailable >= 550) {
        availableVariants.dHarvester.body     = spawnVariants.dHarvester450;
        availableVariants.dHarvester.cost     = 450
        availableVariants.harvester.body      = spawnVariants.harvester450;
        availableVariants.harvester.cost      = 450;
        availableVariants.filler.body         = spawnVariants.filler300;
        availableVariants.filler.cost         = 300;
        availableVariants.upgrader.body       = spawnVariants.upgrader550;
        availableVariants.upgrader.cost       = 550;
        availableVariants.builder.body        = spawnVariants.builder500;
        availableVariants.builder.cost        = 500;
        availableVariants.repairer.body       = spawnVariants.repairer500;
        availableVariants.repairer.cost       = 500;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.warrior.body        = spawnVariants.warrior520;
        availableVariants.warrior.cost        = 520;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
      } else if (room.energyCapacityAvailable >= 500) {
        availableVariants.dHarvester.body     = spawnVariants.dHarvester400;
        availableVariants.dHarvester.cost     = 400
        availableVariants.harvester.body      = spawnVariants.harvester400;
        availableVariants.harvester.cost      = 400;
        availableVariants.filler.body         = spawnVariants.filler300;
        availableVariants.filler.cost         = 300;
        availableVariants.upgrader.body       = spawnVariants.upgrader400;
        availableVariants.upgrader.cost       = 400;
        availableVariants.builder.body        = spawnVariants.builder350;
        availableVariants.builder.cost        = 350;
        availableVariants.repairer.body       = spawnVariants.repairer300;
        availableVariants.repairer.cost       = 300;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane300;
        availableVariants.crane.cost          = 300;
			} else if (room.energyCapacityAvailable >= 400) {
        availableVariants.dHarvester.body     = spawnVariants.dHarvester350;
        availableVariants.dHarvester.cost     = 350
        availableVariants.harvester.body      = spawnVariants.harvester400;
        availableVariants.harvester.cost      = 400;
        availableVariants.filler.body         = spawnVariants.filler300;
        availableVariants.filler.cost         = 300;
        availableVariants.upgrader.body       = spawnVariants.upgrader400;
        availableVariants.upgrader.cost       = 400;
        availableVariants.builder.body        = spawnVariants.builder350;
        availableVariants.builder.cost        = 350;
        availableVariants.repairer.body       = spawnVariants.repairer300;
        availableVariants.repairer.cost       = 300;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane300;
        availableVariants.crane.cost          = 300;
			} else if (room.energyCapacityAvailable >= 350) {
        availableVariants.dHarvester.body     = spawnVariants.dHarvester250;
        availableVariants.dHarvester.cost     = 250
        availableVariants.harvester.body      = spawnVariants.harvester300;
        availableVariants.harvester.cost      = 300;
        availableVariants.filler.body         = spawnVariants.filler200;
        availableVariants.filler.cost         = 200;
        availableVariants.upgrader.body       = spawnVariants.upgrader350;
        availableVariants.upgrader.cost       = 350;
        availableVariants.builder.body        = spawnVariants.builder350;
        availableVariants.builder.cost        = 350;
        availableVariants.repairer.body       = spawnVariants.repairer300;
        availableVariants.repairer.cost       = 300;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane300;
        availableVariants.crane.cost          = 300;
		  } else if (room.energyCapacityAvailable >= 300) {
        availableVariants.dHarvester.body     = spawnVariants.dHarvester150;
        availableVariants.dHarvester.cost     = 150
        availableVariants.harvester.body      = spawnVariants.harvester200;
        availableVariants.harvester.cost      = 200;
        availableVariants.filler.body         = spawnVariants.filler200;
        availableVariants.filler.cost         = 200;
        availableVariants.upgrader.body       = spawnVariants.upgrader300;
        availableVariants.upgrader.cost       = 300;
        availableVariants.builder.body        = spawnVariants.builder300;
        availableVariants.builder.cost        = 300;
        availableVariants.repairer.body       = spawnVariants.repairer300;
        availableVariants.repairer.cost       = 300;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane300;
        availableVariants.crane.cost          = 300;
			}

      //: PER-ROOM LINK MANAGEMENT LOGIC
      if (rMem.objects.links) {
        if (rMem.data.linkRegistry === undefined) room.registerLinks();

        const registeredLinks = Object.entries(rMem.data.linkRegistry);

        if (rMem.objects.links.length !== registeredLinks.length) {
          let counter: number = 0;
          if (rMem.data.linkRegistry.sourceOne      )  counter++;
          if (rMem.data.linkRegistry.central        )  counter++;
          if (rMem.data.linkRegistry.sourceTwo      )  counter++;
          if (rMem.data.linkRegistry.destination    )  counter++;
          if (rMem.data.linkRegistry.remotes) {
            for (let link in rMem.data.linkRegistry.remotes)
              counter++;
          }
          if (rMem.objects.links.length !== counter )  room.registerLinks();
        }

        let linkOne:      StructureLink;
        let linkTwo:      StructureLink;
        let linkCentral:  StructureLink;
        let linkDest:     StructureLink;
        let linkRem1:     StructureLink;
				let linkRem2:			StructureLink;


        if (rMem.data.linkRegistry.sourceOne  ) linkOne     = Game.getObjectById(rMem.data.linkRegistry.sourceOne   );
        if (rMem.data.linkRegistry.sourceTwo  ) linkTwo     = Game.getObjectById(rMem.data.linkRegistry.sourceTwo   );
        if (rMem.data.linkRegistry.destination) linkDest    = Game.getObjectById(rMem.data.linkRegistry.destination );
        if (rMem.data.linkRegistry.central    ) linkCentral = Game.getObjectById(rMem.data.linkRegistry.central     );
        if (rMem.data.linkRegistry.remotes && rMem.data.linkRegistry.remotes[0] ) linkRem1    = Game.getObjectById(rMem.data.linkRegistry.remotes[ 0 ]);
				if (rMem.data.linkRegistry.remotes && rMem.data.linkRegistry.remotes[1] ) linkRem2		= Game.getObjectById(rMem.data.linkRegistry.remotes[ 1 ]);

        if (linkCentral && linkOne) {
          if ((linkOne.store.getFreeCapacity(RESOURCE_ENERGY) < 100) && linkOne.cooldown == 0 && (linkCentral.store.getFreeCapacity(RESOURCE_ENERGY) >= linkOne.store.getUsedCapacity(RESOURCE_ENERGY)))
            linkOne.transferEnergy(linkCentral);
        }
        if (linkCentral && linkTwo) {
          if ((linkTwo.store.getFreeCapacity(RESOURCE_ENERGY) < 100) && linkTwo.cooldown == 0 && (linkCentral.store.getFreeCapacity(RESOURCE_ENERGY) >= linkTwo.store.getUsedCapacity(RESOURCE_ENERGY)))
            linkTwo.transferEnergy(linkCentral);
        }
        if (linkCentral && linkDest) {
          if ((linkCentral.store[RESOURCE_ENERGY] > 99) && linkCentral.cooldown == 0 && linkDest.store[RESOURCE_ENERGY] < 401)
            linkCentral.transferEnergy(linkDest);
        }

        if (linkCentral && linkRem1) {
          if ((linkRem1.store.getUsedCapacity(RESOURCE_ENERGY) > 100) && linkRem1.cooldown == 0 && (linkCentral.store.getFreeCapacity(RESOURCE_ENERGY) >= linkRem1.store.getUsedCapacity(RESOURCE_ENERGY)))
            linkRem1.transferEnergy(linkCentral);
        }

				if (linkCentral && linkRem2) {
					if ((linkRem2.store.getUsedCapacity(RESOURCE_ENERGY) > 100) && linkRem2.cooldown == 0 && (linkCentral.store.getFreeCapacity(RESOURCE_ENERGY) >= linkRem2.store.getUsedCapacity(RESOURCE_ENERGY)))
						linkRem2.transferEnergy(linkCentral);
				}
      }

      //$ >#######################################################################################################################< $\\
      //$> ################################## SPAWNING QUOTA & CURRENT SPAWN COUNT DECLARATIONS ################################## <$\\
      //$ >#######################################################################################################################< $\\

      // pull creep role caps from room memory, or set to default value if none are set
      let harvesterTarget :  number = _.get(room.memory, ['targets', 'harvester'], 2);
      let fillerTarget    :  number = _.get(room.memory, ['targets', 'filler'		], 2);
			let collectorTarget :  number = _.get(room.memory, ['targets', 'collector'], 2);
      let upgraderTarget  :  number = _.get(room.memory, ['targets', 'upgrader' ], 2);
      let builderTarget   :  number = _.get(room.memory, ['targets', 'builder'  ], 2);
      let repairerTarget  :  number = _.get(room.memory, ['targets', 'repairer' ], 1);
      let runnerTarget    :  number = _.get(room.memory, ['targets', 'runner'   ], 3);
      let rebooterTarget  :  number = _.get(room.memory, ['targets', 'rebooter' ], 0);
      let reserverTarget  :  number = _.get(room.memory, ['targets', 'reserver' ], 0);
      let rangerTarget    :  number = _.get(room.memory, ['targets', 'ranger'   ], 0);
      let warriorTarget   :  number = _.get(room.memory, ['targets', 'warrior'  ], 0);
      let healerTarget    :  number = _.get(room.memory, ['targets', 'healer'   ], 0);
      let craneTarget     :  number = _.get(room.memory, ['targets', 'crane'    ], 0);
      let minerTarget     :  number = _.get(room.memory, ['targets', 'miner'    ], 0);
      let scientistTarget :  number = _.get(room.memory, ['targets', 'scientist'], 0);
      let scoutTarget     :  number = _.get(room.memory, ['targets', 'scout'    ], 0);


      let remoteHarvesterTarget:   number;
      if (rMem.outposts !== undefined && rMem.outposts.aggregateSourceList !== undefined) remoteHarvesterTarget = rMem.outposts.aggregateSourceList.length;
      else remoteHarvesterTarget          = _.get(room.memory, ['targets', 'remoteharvester'  ], 1);
      let remoteBuilderTarget:     number = _.get(room.memory, ['targets', 'remotebuilder'    ], 1);
      let remoteGuardTarget:       number = _.get(room.memory, ['targets', 'remoteguard'      ], 1);
      let remoteLogisticianTarget: number = _.get(room.memory, ['targets', 'remotelogistician'], 1);

      // pull current amount of creeps alive by roleForQuota
      let harvesters:         Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'harvester'         &&      creep.memory.homeRoom == roomName);
      let fillers:         		Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'filler'    	      &&      creep.memory.homeRoom == roomName);
			let collectors:         Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'collector'  	      &&      creep.memory.homeRoom == roomName);
      let upgraders:          Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'upgrader'          &&      creep.memory.homeRoom == roomName);
      let builders:           Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'builder'           &&      creep.memory.homeRoom == roomName);
      let repairers:          Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'repairer'          &&      creep.memory.homeRoom == roomName);
      let runners:            Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'runner'            &&      creep.memory.homeRoom == roomName);
      let rebooters:          Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'rebooter'          &&      creep.memory.homeRoom == roomName);
      let reservers:          Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'reserver'          &&      creep.memory.homeRoom == roomName);
      let rangers:            Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'ranger'            &&      creep.memory.homeRoom == roomName);
      let warriors:           Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'warrior'           &&      creep.memory.homeRoom == roomName);
      let healers:            Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'healer'            &&      creep.memory.homeRoom == roomName);
      let cranes:             Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'crane'             &&      creep.memory.homeRoom == roomName);
      let miners:             Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'miner'             &&      creep.memory.homeRoom == roomName);
      let scientists:         Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'scientist'         &&      creep.memory.homeRoom == roomName);
      let scouts:             Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'scout'             &&      creep.memory.homeRoom == roomName);

      let remoteHarvesters:   Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'remoteharvester'   &&      creep.memory.homeRoom == roomName);
      let remoteBuilders:     Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'remotebuilder'     &&      creep.memory.homeRoom == roomName);
      let remoteGuards:       Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'remoteguard'       &&      creep.memory.homeRoom == roomName);
      let remoteLogisticians: Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'remotelogistician' &&      creep.memory.homeRoom == roomName);

      let sites: Array<ConstructionSite> = room.find(FIND_CONSTRUCTION_SITES);
      let remoteSites: Array<ConstructionSite> = [];

      if (room.memory.outposts !== undefined) {
        for (let i = 0; i < room.memory.outposts.roomList.length; i++) {
          if (Game.rooms[room.memory.outposts.roomList[i]] !== undefined) {
            const outpostSites = Game.rooms[room.memory.outposts.roomList[i]].find(FIND_CONSTRUCTION_SITES);
            remoteSites = remoteSites.concat(outpostSites);
          }
        }
      }

      // Select a non-geriatric filler to loot compounds or energy from enemy corpses
      let invaderLooterAnnounced: boolean = false;
      if (invaderLooterAnnounced == false) {
        const hostiles: Array<Creep> = room.find(FIND_HOSTILE_CREEPS);
        if (hostiles.length > 0) {
          const hostileOwner: string = hostiles[0].owner.username;
          const creepName:    string = hostiles[0].name;
          log(hostileOwner + ': -----------------HOSTILE CREEPS PRESENT----------------- ' + creepName, room);
          room.visual.rect(-1, -1, 51, 51, { fill: '#440000', stroke: '#ff0000', opacity: 0.2, strokeWidth: 0.2 });
          if (fillers.length) {
            for (let i = 0; i < fillers.length; i++) {
              if (fillers[i].ticksToLive > 300) {
                fillers[i].memory.invaderLooter = true;
                console.log('Creep \'' + fillers[i].name + '\' is now the invader looter.');
                invaderLooterAnnounced = true;
                break;
              } else
                continue;
            }
          }
        } else invaderLooterAnnounced = false;
      }

      let creepCount: number = 0;
      let capacity:   number;

      if (Memory.creeps) {
        creepCount = Object.keys(Memory.creeps).length;

        if (creepCount < 2)  capacity = room.energyAvailable;
        else  capacity = room.energyCapacityAvailable;
      }

      if (rMem.settings.flags.craneUpgrades == true) {
        availableVariants.crane.body        = spawnVariants.crane800;
        availableVariants.crane.cost        = 800;
      }


      // * if we have no fillers, and our energy supply is not enough for a 500 energy spawn, do a 300.
      if (fillers.length == 0) {
        if (room.energyAvailable < 500)
          availableVariants.filler.body   = spawnVariants.filler300;
      }

      // ensure that two harvesters never use the same source for harvesting, when spawning 6-work harvesters
      // if it happens, send the older one to the opposite source
      if (harvesters.length >= 2 && harvesters[0].getActiveBodyparts(WORK) >= 5) {
        if (harvesters[0].memory.source == harvesters[1].memory.source) {
          if (harvesters[0].ticksToLive > harvesters[1].ticksToLive) {
            harvesters[1].assignHarvestSource(true);
            log('Reassigned ' + harvesters[1].name + '\'s source due to conflict.', room);
          }
          else {
            harvesters[0].assignHarvestSource(true);
            log('Reassigned ' + harvesters[0].name + '\'s source due to conflict.', room);
          }
        }
      }

      //$ >#######################################################################################################################< $\\
      //$> ################################## CREEP PRE-SPAWN LOGIC FOR HIGHLY IMPORTANT ROLES ################################### <$\\
      //$ >#######################################################################################################################< $\\

      for (let i = 0; i < harvesters.length; i++) {       // * Harvester Pre-Spawn
        harvesterDying = false;
        if (harvesters[i].ticksToLive <= 50) {
          harvesterDying = true;
          break;
        }
      }
      for (let i = 0; i < runners.length; i++) {          // * Runner Pre-Spawn
        runnerDying = false;
        if (runners[i].ticksToLive <= 20) {
          runnerDying = true;
          break;
        }
      }
      for (let i = 0; i < remoteHarvesters.length; i++) { // * Remote Harvester Pre-Spawn
        remoteHarvesterDying = false;
        if (remoteHarvesters[i].ticksToLive <= 110) {
          remoteHarvesterDying = true;
          break;
        }
      }
      for (let i = 0; i < fillers.length; i++) {       // * Filler Pre-Spawn
        fillerDying = false;
        if (fillers[i].ticksToLive <= 30) {
          fillerDying = true;
          break;
        }
      }
      for (let i = 0; i < remoteGuards.length; i++) {     // * Remote Guard Pre-Spawn
        remoteGuardDying = false;
        if (remoteGuards[i].ticksToLive <= 110) {
          remoteGuardDying = true;
          break;
        }
      }
      for (let i = 0; i < miners.length; i++) {           // * Miner Pre-Spawn
        minerDying = false;
        if (miners[i].ticksToLive <= 60) {
          minerDying = true;
          break;
        }
      }

      // $ >#####################################################################################################################< $ \\
      // $> ################################################ SPAWN MANAGEMENT SYSTEM ############################################ <$ \\
      // $ >#####################################################################################################################< $ \\

      const colIndex:   number         = Memory.colonies.colonyList.indexOf(room.name);
      const colonyNum:  number         = colIndex + 1;
      const colonyName: string         = 'Col' + colonyNum;

      const spawns: StructureSpawn[] = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_SPAWN}});

      if (spawns.length) {
        let readySpawn: StructureSpawn = spawns[0];
        for (let i = 0; i < spawns.length; i++) {
          const thisSpawn: StructureSpawn = spawns[i];

						if (thisSpawn.memory.spawnPriorityList === undefined)
							thisSpawn.memory.spawnPriorityList = [
								'harvester',
								'collector',
								'filler',
								'runner',
								'crane',
								'repairer',
								'builder',
								'upgrader',
								'remoteharvester',
								'remoterunner',
								'remotebuilder',
								'reserver',
								'remoteguard',
								'claimer',
								'miner',
								'healer',
								'warrior',
								'ranger',
								'invader',
								'provider',
								'rebooter',
								'remotelogistician',
								'scientist',
								'scout',
								]


          if (thisSpawn.spawning) continue;
          else readySpawn = thisSpawn;
        }
        if (!readySpawn.spawning) {
          const numCreeps: number = Object.keys(Game.creeps).length;
          if (numCreeps == 0 && room.energyAvailable <= 300 && (!room.storage || (room.storage &&  room.storage.store[RESOURCE_ENERGY] < 500)) && room.controller.level > 1) {
            newName = colonyName + '_Rb' + creepRoleCounts.rebooter;
            while (readySpawn.spawnCreep([WORK, WORK, MOVE], newName, { memory: { role: 'rebooter', roleForQuota: 'rebooter', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
              creepRoleCounts.rebooter++;
              newName = colonyName + '_Rb' + creepRoleCounts.rebooter;
            }
            log('Spawning an emergency Rebooter...', room);
          } else if (fillers.length <= 1 && room.energyAvailable <= 300 && room.storage && room.storage.store[RESOURCE_ENERGY] >= 500) {
            const result = readySpawn.spawnCreep([CARRY, MOVE], 'Collie the Emergency Filler Creep', { memory: { role: 'filler', roleForQuota: 'filler', homeRoom: roomName } });
            switch (result) {
              case OK:
                log('Spawning an emergency Filler...', room);
              case ERR_BUSY:
              case ERR_NOT_ENOUGH_ENERGY:
              case ERR_INVALID_ARGS:
              case ERR_RCL_NOT_ENOUGH:
                break;
              case ERR_NAME_EXISTS:
                readySpawn.spawnCreep([CARRY, MOVE], 'Collie the Emergency Filler Back-up Creep', { memory: { role: 'filler', roleForQuota: 'filler', homeRoom: roomName } });
                break;
            }
          } else if ((fillers.length < 2 || harvesters.length < 2) && room.energyAvailable <= 1000 && room.energyCapacityAvailable >= 1000) {

						if (fillers.length <= 1 && fillers.length < fillerTarget) {
							newName = colonyName + '_F' + creepRoleCounts.filler;
              while (readySpawn.spawnCreep(readySpawn.determineBodyparts('filler', room.energyAvailable), newName, { memory: { role: 'filler', roleForQuota: 'filler', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                creepRoleCounts.filler++;
                newName = colonyName + '_F' + creepRoleCounts.filler;
              }
						}
						if (harvesters.length == 0 && harvesters.length < harvesterTarget) {
							if (room.memory.settings.flags.dropHarvestingEnabled) {
								newName = colonyName + '_H' + creepRoleCounts.harvester;
								while (readySpawn.spawnCreep(availableVariants.dHarvester.body, newName, {
									 memory: { role: 'harvester', roleForQuota: 'harvester', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
									creepRoleCounts.harvester++;
									newName = colonyName + '_H' + creepRoleCounts.harvester;
								}
							} else {
								newName = colonyName + '_H' + creepRoleCounts.harvester;
								while (readySpawn.spawnCreep(availableVariants.harvester.body, newName, {
										memory: { role: 'harvester', roleForQuota: 'harvester', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
									creepRoleCounts.harvester++;
									newName = colonyName + '_H' + creepRoleCounts.harvester;
								}
							}
						}
					} else {
							if ((harvesters.length < harvesterTarget) || (harvesters.length <= harvesterTarget && harvesterDying && harvesterTarget !== 0)) {
								if (room.memory.settings.flags.dropHarvestingEnabled) {
									newName = colonyName + '_H' + creepRoleCounts.harvester;
									while (readySpawn.spawnCreep(availableVariants.dHarvester.body, newName, {
										memory: { role: 'harvester', roleForQuota: 'harvester', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
										creepRoleCounts.harvester++;
										newName = colonyName + '_H' + creepRoleCounts.harvester;
									}
								} else {
									newName = colonyName + '_H' + creepRoleCounts.harvester;
									while (readySpawn.spawnCreep(availableVariants.harvester.body, newName, {
										memory: { role: 'harvester', roleForQuota: 'harvester', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
										creepRoleCounts.harvester++;
										newName = colonyName + '_H' + creepRoleCounts.harvester;
									}
								}
							} else if ((fillers.length < fillerTarget) || (fillers.length <= fillerTarget && fillerDying && fillerTarget !== 0)) {
								let max = 1000;
								if (room.energyAvailable < max) max = room.energyAvailable;
								newName = colonyName + '_F' + creepRoleCounts.filler;
								while (readySpawn.spawnCreep(readySpawn.determineBodyparts('filler', max), newName, {
									memory: { role: 'filler', roleForQuota: 'filler', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
									creepRoleCounts.filler++;
									newName = colonyName + '_F' + creepRoleCounts.filler;
								}
							} else if (!readySpawn.spawning && ((runners.length < runnerTarget) || (runners.length <= runnerTarget && runnerDying && runnerTarget !== 0))) {
									newName = colonyName + '_Rn' + creepRoleCounts.runner;
									if (numCreeps >= 5 && room.storage) {
										while (readySpawn.spawnCreep(readySpawn.determineBodyparts('runner', room.energyCapacityAvailable), newName, {
											memory: { role: 'runner', roleForQuota: 'runner', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
											creepRoleCounts.runner++;
											newName = colonyName + '_Rn' + creepRoleCounts.runner;
										}
									} else {
										while (readySpawn.spawnCreep(availableVariants.runner.body, newName, {
											memory: { role: 'runner', roleForQuota: 'runner', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
											creepRoleCounts.runner++;
											newName = colonyName + '_Rn' + creepRoleCounts.runner;
										}
									}
							} else if (room.storage && cranes.length < craneTarget) {
									log(readySpawn.name + ': Crane');
									newName = colonyName + '_Cn' + creepRoleCounts.crane;
									while (readySpawn.spawnCreep(availableVariants.crane.body, newName, {
										memory: { role: 'crane', roleForQuota: 'crane', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
										creepRoleCounts.crane++;
										newName = colonyName + '_Cn' + creepRoleCounts.crane;
									}
							} else if ((remoteHarvesters.length < remoteHarvesterTarget) || (remoteHarvesters.length <= remoteHarvesterTarget && remoteHarvesterDying && remoteHarvesterTarget !== 0)) {
									log(readySpawn.name + ': Remote Harvester');
									newName = colonyName + '_RH' + creepRoleCounts.remoteHarvester;
									while (readySpawn.spawnCreep([CARRY, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK], newName, {
										memory: { role: 'remoteharvester', roleForQuota: 'remoteharvester', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
										creepRoleCounts.remoteHarvester++;
										newName = colonyName + '_RH' + creepRoleCounts.remoteHarvester;
									}
							} else if ((reservers.length < reserverTarget) || (reservers.length <= reserverTarget && reserverDying && reserverTarget !== 0)) {
								log(readySpawn.name + ': Reserver');
								newName = colonyName + '_Rv' + creepRoleCounts.reserver;
								while (readySpawn.spawnCreep(availableVariants.reserver.body, newName, {
									memory: { role: 'reserver', roleForQuota: 'reserver', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
									creepRoleCounts.reserver++;
									newName = colonyName + '_Rv' + creepRoleCounts.reserver;
								}
							} else if ((!room.storage && sites.length > 0 && builders.length < builderTarget) || (room.storage && room.storage.store.getUsedCapacity(RESOURCE_ENERGY) >= rMem.settings.upgraderMinEnergy && sites.length > 0 && builders.length < builderTarget)) {
									log(readySpawn.name + ': Builder');
									newName = colonyName + '_B' + creepRoleCounts.builder;
									while (readySpawn.spawnCreep(availableVariants.builder.body, newName, {
										memory: { role: 'builder', roleForQuota: 'builder', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
										creepRoleCounts.builder++;
										newName = colonyName + '_B' + creepRoleCounts.builder;
									}
							} else if ((!room.storage && upgraders.length < upgraderTarget) || (room.storage && room.storage.store.getUsedCapacity(RESOURCE_ENERGY) >= rMem.settings.upgraderMinEnergy && upgraders.length < upgraderTarget)) {
									log(readySpawn.name + ': Upgrader');
									newName = colonyName + '_U' + creepRoleCounts.upgrader;
									while (readySpawn.spawnCreep(availableVariants.upgrader.body, newName, {
										memory: { role: 'upgrader', roleForQuota: 'upgrader', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
										creepRoleCounts.upgrader++;
										newName = colonyName + '_U' + creepRoleCounts.upgrader;
									}
							} else if (repairers.length < repairerTarget) {
									log(readySpawn.name + ': Repairer');
									newName = colonyName + '_Rp' + creepRoleCounts.repairer;
									while (readySpawn.spawnCreep(availableVariants.repairer.body, newName, {
										memory: { role: 'repairer', roleForQuota: 'repairer', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
										creepRoleCounts.repairer++;
										newName = colonyName + '_Rp' + creepRoleCounts.repairer;
									}
							} else if (miners.length < minerTarget && rMem.objects.extractor) {
								log(readySpawn.name + ': Miner');
								newName = colonyName + '_M' + creepRoleCounts.miner;
								while (readySpawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName, {
									memory: { role: 'miner', roleForQuota: 'miner', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
									creepRoleCounts.miner++;
									newName = colonyName + '_M' + creepRoleCounts.miner;
								}
							} else if (scientists.length < scientistTarget && rMem.objects.labs) {
								log(readySpawn.name + ': Scientist');
								newName = colonyName + '_S' + creepRoleCounts.scientist;
								while (readySpawn.spawnCreep([MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY], newName, {
									memory: { role: 'scientist', roleForQuota: 'scientist', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
									creepRoleCounts.scientist++;
									newName = colonyName + '_S' + creepRoleCounts.scientist;
								}
							} else if (remoteSites.length > 0 && remoteBuilders.length < remoteBuilderTarget) {
								log(readySpawn.name + ': Remote Builder');
								newName = colonyName + '_RB' + creepRoleCounts.remoteBuilder;
								while (readySpawn.spawnCreep(availableVariants.builder.body, newName, {
									memory: { role: 'remotebuilder', roleForQuota: 'remotebuilder', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
									creepRoleCounts.remoteBuilder++;
									newName = colonyName + '_RB' + creepRoleCounts.remoteBuilder;
								}
							} else if ((remoteGuards.length < remoteGuardTarget) || (remoteGuards.length <= remoteGuardTarget && remoteGuardDying && remoteGuardTarget !== 0)) {
								log(readySpawn.name + ': Remote Guard');
								newName = colonyName + '_RG' + creepRoleCounts.remoteGuard;
								while (readySpawn.spawnCreep(availableVariants.remoteGuard.body, newName, {
									memory: { role: 'remoteguard', roleForQuota: 'remoteguard', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
									creepRoleCounts.remoteGuard++;
									newName = colonyName + '_RG' + creepRoleCounts.remoteGuard;
								}
							} else if (remoteLogisticians.length < remoteLogisticianTarget) {
								log(readySpawn.name + ': Remote Logistician');
								newName = colonyName + '_RL' + creepRoleCounts.remoteLogistician;
								while (readySpawn.spawnCreep(availableVariants.remoteLogi.body, newName, {
									memory: { role: 'remotelogistician', roleForQuota: 'remotelogistician', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
									creepRoleCounts.remoteLogistician++;
									newName = colonyName + '_RL' + creepRoleCounts.remoteLogistician;
								}
							} else if (rangers.length < rangerTarget) {
								log(readySpawn.name + ': Ranger');
								newName = colonyName + '_Rng' + creepRoleCounts.ranger;
								while (readySpawn.spawnCreep(availableVariants.ranger.body, newName, {
									memory: { role: 'ranger', roleForQuota: 'ranger', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
									creepRoleCounts.ranger++;
									newName = colonyName + '_Rng' + creepRoleCounts.ranger;
								}
							} else if (warriors.length < warriorTarget) {
								log(readySpawn.name + ': Warrior');
								newName = colonyName + '_War' + creepRoleCounts.warrior;
								while (readySpawn.spawnCreep(availableVariants.warrior.body, newName, {
									memory: { role: 'warrior', roleForQuota: 'warrior', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
									creepRoleCounts.warrior++;
									newName = colonyName + '_War' + creepRoleCounts.warrior;
								}
							} else if (healers.length < healerTarget) {
								log(readySpawn.name + ': Healer');
								newName = colonyName + '_Hlr' + creepRoleCounts.healer;
								while (readySpawn.spawnCreep(availableVariants.healer.body, newName, {
									memory: { role: 'healer', roleForQuota: 'healer', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
									creepRoleCounts.healer++;
									newName = colonyName + '_Hlr' + creepRoleCounts.healer;
								}
							} else if (scouts.length < scoutTarget) {
								log(readySpawn.name + ': Scout');
								newName = colonyName + '_Sct' + creepRoleCounts.scout;
								while (readySpawn.spawnCreep([MOVE], newName, {
									memory: { role: 'scout', roleForQuota: 'scout', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
									creepRoleCounts.scout++;
									newName = colonyName + '_Sct' + creepRoleCounts.scout;
								}
							}
							// ! END OF PRIMARY SPAWN CHECKING

							//* Auto-Spawn Scouts for when outpost rooms lose vision, send them there and put them to sleep
							let blindRoomCount = 0;
							if (room.memory.outposts) {
								for (let i = 0; i < room.memory.outposts.roomList.length; i++) {
									const outpostName = room.memory.outposts.roomList[i];
									if (!Game.rooms[outpostName]) blindRoomCount++;
								}
								for (let i = 0; i < room.memory.outposts.roomList.length; i++) {
									const outpostName = room.memory.outposts.roomList[i];

									if (!Game.rooms[outpostName] && scouts.length < blindRoomCount) {
										newName = colonyName + '_AutoSct' + creepRoleCounts.scout;
										while (readySpawn.spawnCreep([MOVE], newName, {
											memory: {role: 'scout', roleForQuota: 'scout', homeRoom: roomName, rallyPoint: outpostName, goToBed: true}}) == ERR_NAME_EXISTS) {
											creepRoleCounts.scout++;
											newName = colonyName + '_AutoSct' + creepRoleCounts.scout;
										}
									}
								}
							}
							/*
						const tombstones = room.find(FIND_TOMBSTONES, {filter: (i) => i.store.getUsedCapacity() > 0});
						const piles = room.find(FIND_DROPPED_RESOURCES);
						let bigPiles = false;
						_.forEach(piles, (pile) => {
							if (pile.amount >= 1000)
								bigPiles = true;
						});
						if ((bigPiles || tombstones.length) && collectors.length < (collectorTarget || 1)) {
							newName = colonyName + '_AutoCol' + creepRoleCounts.collector;
								while (readySpawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE], newName, {
									memory: {role: 'collector', roleForQuota: 'collector', homeRoom: roomName}}) == ERR_NAME_EXISTS) {
									creepRoleCounts.collector++;
									newName = colonyName + '_AutoCol' + creepRoleCounts.collector;
								}
						}
						*/
					}
        }

        let  makeWaitHarvester = 0;
        let  makeWaitHauler = 0;
        let  makeWaitBuilder = 0;
        let  makeWaitClaimer = 0;

        if (rMem.data.claimRooms !== undefined) {
          const rooms = Object.keys(rMem.data.claimRooms) as RoomName[];
          if (makeWaitHarvester !== 100) makeWaitHarvester = 0;
          if (makeWaitHauler !== 100) makeWaitHauler = 0;
          if (makeWaitClaimer !== 100) makeWaitClaimer = 0;
          if (makeWaitBuilder !== 100) makeWaitBuilder = 0;

          for (let i = 0; i < rooms.length; i++) {
            if (tickCount % makeWaitClaimer == 0 && rMem.data.claimRooms[rooms[i]].hasBeenClaimed === false && rMem.data.claimRooms[rooms[i]].claimerSpawned === false && !readySpawn.spawning) {
              const creeps = Object.entries(Memory.creeps);
              const claimers = creeps.filter((creep) => creep[1].memory.role === 'claimer');
              console.log(claimers);
              const claimerSpawned = readySpawn.spawnClaimer(rMem.data.claimRooms[rooms[i]].roomName, 'Claimer' + i + 1, true);
              if (claimerSpawned === 'OK')
                rMem.data.claimRooms[rooms[i]].claimerSpawned = true;
              else if (claimerSpawned === 'ERR_NOT_ENOUGH_RESOURCES')
                makeWaitClaimer = 100;
            } else if (tickCount % makeWaitHarvester == 0 && rMem.data.claimRooms[rooms[i]].neededHarvesters > 0 && !readySpawn.spawning) {
              const harvesterSpawned = readySpawn.spawnNewClaimHarvester(rMem.data.claimRooms[rooms[i]].roomName, 'NewClaimHarvester' + i);
              if (harvesterSpawned === 'OK')
                  rMem.data.claimRooms[rooms[i]].neededHarvesters -= 1;
              else if (harvesterSpawned === 'ERR_NOT_ENOUGH_RESOURCES')
                makeWaitHarvester = 100;
            } else if (tickCount % makeWaitBuilder == 0 && rMem.data.claimRooms[rooms[i]].neededBuilders > 0 && !readySpawn.spawning) {
              const builderSpawned = readySpawn.spawnNewClaimBuilder(rMem.data.claimRooms[rooms[i]].roomName, 'NewClaimBuilder' + i);
              if (builderSpawned === 'OK')
                rMem.data.claimRooms[rooms[i]].neededBuilders -= 1;
              else if (builderSpawned === 'ERR_NOT_ENOUGH_RESOURCES')
                makeWaitBuilder = 100;
            } else if (tickCount % makeWaitHauler == 0 && rMem.data.claimRooms[rooms[i]].energyRemaining > 0) {
              const haulerSpawned = readySpawn.spawnNewClaimHauler(rMem.data.claimRooms[rooms[i]].roomName, 'NewClaimHauler');
              if (haulerSpawned === 'OK')
                break;
              else if (haulerSpawned === 'ERR_NOT_ENOUGH_RESOURCES')
                makeWaitHauler = 100;
            }
          }
        }

        //* Displays Energy Available / Energy Capacity above Spawn Location
        room.visual.text('Energy: ' + room.energyAvailable
          + '/' + room.energyCapacityAvailable,
          readySpawn.pos.x,
          readySpawn.pos.y - 1,
          { align: 'center', opacity: 0.8, color: '#00dddd', stroke: '#000000', font: 0.4 }
        );

      } //! END OF PRIMARY SPAWNING LOGIC

      //$ >#######################################################################################################################< $\\
      //#region ######################################### ROOM VISUALS DISPLAY IMPLEMENTATION #################################### <$\\
      //$ >#######################################################################################################################< $\\

      //: PER SPAWN CREEP SPAWNING INFORMATION
      if (spawns.length) {
        for (let i = 0; i < spawns.length; i++) {
          if (spawns[i].spawning) {

            let spawningCreep = Game.creeps[spawns[i].spawning.name];
            if (Memory.miscData.rooms[room.name].spawnAnnounced) {
              console.log(spawns[i].room.link() + ': Spawning new creep: ' + spawningCreep.memory.role + ' (' + spawningCreep.name + ')');
              Memory.miscData.rooms[room.name].spawnAnnounced = true;
            }
            spawns[i].room.visual.text(spawningCreep.memory.role + ' - ' + spawns[i].spawning.remainingTime + '/' + spawns[i].spawning.needTime, spawns[i].pos.x, spawns[i].pos.y + 1.25, { stroke: '#111111', color: '#ff00ff', align: 'center', opacity: 0.8, font: 0.4 });
          } else
            Memory.miscData.rooms[room.name].spawnAnnounced = false;
        }


      //: CONSOLE-BASED CREEP CENSUS VS TARGETS & ENERGY CAPACITY

        const tickInterval: number = Memory.globalSettings.consoleSpawnInterval;
        let storageInfo = '';
        if (room.storage) storageInfo = '<' + room.storage.store[ RESOURCE_ENERGY ].toString() + '> ';
        const energy  :  string = 'NRG: ' + room.energyAvailable + '/' + room.energyCapacityAvailable + '(' + (room.energyAvailable / room.energyCapacityAvailable * 100).toFixed(0) + '%) ';
        const hInfo   :  string = (harvesterTarget)       ? '| H:'   + harvesters.length       + '(' + harvesterTarget       + ') ' : '';
        const fInfo   :  string = (fillerTarget)       ? '| C:'   + fillers.length       + '(' + fillerTarget       + ') ' : '';
        const rInfo   :  string = (runnerTarget)          ? '| Rn:'  + runners.length          + '(' + runnerTarget          + ') ' : '';
        const bInfo   :  string = (builderTarget)         ? '| B:'   + builders.length         + '(' + builderTarget         + ') ' : '';
        const uInfo   :  string = (upgraderTarget)        ? '| U:'   + upgraders.length        + '(' + upgraderTarget        + ') ' : '';
        const rpInfo  :  string = (repairerTarget)        ? '| Rp:'  + repairers.length        + '(' + repairerTarget        + ') ' : '';
        const cnInfo  :  string = (craneTarget)           ? '| Cn:'  + cranes.length           + '(' + craneTarget           + ') ' : '';
        const rtInfo  :  string = (rebooterTarget)        ? '| Rb:'  + rebooters.length        + '(' + rebooterTarget        + ') ' : '';
        const rvInfo  :  string = (reserverTarget)        ? '| Rv:'  + reservers.length        + '(' + reserverTarget        + ') ' : '';
        const rngInfo :  string = (rangerTarget)          ? '| Rng:' + rangers.length          + '(' + rangerTarget          + ') ' : '';
        const warInfo :  string = (warriorTarget)         ? '| War:' + warriors.length         + '(' + warriorTarget         + ') ' : '';
        const hlrInfo :  string = (healerTarget)          ? '| Hlr:' + healers.length          + '(' + healerTarget          + ') ' : '';
        const rhInfo  :  string = (remoteHarvesterTarget) ? '| RH:'  + remoteHarvesters.length + '(' + remoteHarvesterTarget + ') ' : '';
        const rbInfo  :  string = (remoteBuilderTarget)   ? '| RB:'  + remoteBuilders.length   + '(' + remoteBuilderTarget   + ') ' : '';
        const rgInfo  :  string = (remoteGuardTarget)     ? '| RG:'  + remoteGuards.length     + '(' + remoteGuardTarget     + ')'  : '';

        if (tickInterval !== 0 && tickCount % tickInterval === 0) {
          console.log(room.link() + energy + storageInfo + hInfo + fInfo + rInfo + bInfo + uInfo + rpInfo + cnInfo + rtInfo + rvInfo + rngInfo + warInfo + hlrInfo + rhInfo + rbInfo + rgInfo + ' Tick: ' + tickCount);
        }

        //: ROOM VISUALS - SPAWN INFO BOXES
        const rmFlgs: RoomFlags      = rMem.settings.flags;
        const rmVis : VisualSettings = rMem.settings.visualSettings;

        if (rmVis === undefined || rmVis.spawnInfo === undefined) room.initSettings();
        const alignment : alignment = rmVis.spawnInfo.alignment;
        const spawnColor: string    = rmVis.spawnInfo.color;
        const spawnFont : number    = rmVis.spawnInfo.fontSize || 0.5;
        let spawnX      : number    = 49;
        if (alignment == 'left') spawnX = 0;

        //* BOTTOM RIGHT BOX
        room.visual.rect(
          41.75, 44.5, 7.5, 4.75,
          { fill: '#555555',
          stroke: '#aaaaaa',
          opacity: 0.3,
          strokeWidth: 0.2
        });
        // Harvesters, Fillers, Upgraders, Builders, Cranes
        room.visual.text(
              'H:'  + harvesters.length + '(' + harvesterTarget +
          ') | C:'  + fillers.length + '(' + fillerTarget +
          ') | U:'  + upgraders.length  + '(' + upgraderTarget  +
          ') | B:'  + builders.length   + '(' + builderTarget   +
          ') | Cn:' + cranes.length     + '(' + craneTarget     + ')',
          spawnX, 49,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });
        // Remote Harvesters, Remote Runners, Remote Builders, Remote Guards
        room.visual.text(
              'RH:' + remoteHarvesters.length + '(' + remoteHarvesterTarget +
          ') | RB:' + remoteBuilders.length   + '(' + remoteBuilderTarget   +
          ') | RG:' + remoteGuards.length     + '(' + remoteGuardTarget     + ')',
          spawnX, 48,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });
        // Runners, Repaireres, Rebooters, Reservers
        room.visual.text(
              'Rn:' + runners.length   + '(' + runnerTarget   +
          ') | Rp:' + repairers.length + '(' + repairerTarget +
          ') | Rb:' + rebooters.length + '(' + rebooterTarget +
          ') | Rv:' + reservers.length + '(' + reserverTarget + ')',
          spawnX, 47,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });
        // Rangers, Warriors, Healers
        room.visual.text(
              'Rng:' + rangers.length   + '(' + rangerTarget  +
          ') | War:' + warriors.length  + '(' + warriorTarget +
          ') | Hlr:' + healers.length   + '(' + healerTarget  + ')',
          spawnX, 46,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });
        // Energy Available, Energy Capacity
        room.visual.text(
          'Energy: ' + room.energyAvailable + '('
            + room.energyCapacityAvailable + ')',
          spawnX, 45,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });

        //* TOP RIGHT BOX
        room.visual.rect(
          41.75, 0, 7.5, 4.75,
          { fill: '#555555',
            stroke: '#aaaaaa',
            opacity: 0.3,
            strokeWidth: 0.2
          });
        // Harvesters, Fillers, Upgraders, Builders, Cranes
        room.visual.text(
              'H:'  + harvesters.length + '(' + harvesterTarget +
          ') | C:'  + fillers.length + '(' + fillerTarget +
          ') | U:'  + upgraders.length  + '(' + upgraderTarget  +
          ') | B:'  + builders.length   + '(' + builderTarget   +
          ') | Cn:' + cranes.length     + '(' + craneTarget     + ')',
          spawnX, 0.5,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });
        // Remote Harvesters, Remote Runners, Remote Builders, Remote Guards
        room.visual.text(
              'RH:' + remoteHarvesters.length + '(' + remoteHarvesterTarget +
          ') | RB:' + remoteBuilders.length   + '(' + remoteBuilderTarget   +
          ') | RG:' + remoteGuards.length     + '(' + remoteGuardTarget     + ')',
          spawnX, 1.5,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });
        // Runners, Repairers, Rebooters, Reservers
        room.visual.text(
              'Rn:' + runners.length   + '(' + runnerTarget   +
          ') | Rp:' + repairers.length + '(' + repairerTarget +
          ') | Rb:' + rebooters.length + '(' + rebooterTarget +
          ') | Rv:' + reservers.length + '(' + reserverTarget + ')',
          spawnX, 2.5,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });
        // Rangers, Warriors, Healers
        room.visual.text(
              'Rng:' + rangers.length   + '(' + rangerTarget  +
          ') | War:' + warriors.length  + '(' + warriorTarget +
          ') | Hlr:' + healers.length   + '(' + healerTarget  + ')',
          spawnX, 3.5,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });
        // Energy Available, Energy Capacity
        room.visual.text(
          'Energy: ' + room.energyAvailable + '('
          + room.energyCapacityAvailable + ')',
          spawnX, 4.5,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });

        //: ROOM VISUALS - ROOM FLAG SETTINGS BOX

        const xCoord:       number = rmVis.roomFlags.displayCoords[0];
        const yCoord:       number = rmVis.roomFlags.displayCoords[1];
        const fontSize:     number = rmVis.roomFlags.fontSize || 0.4;
        const displayColor: string = rmVis.roomFlags.color;

        //* OUTER RECTANGLE
        room.visual.rect(
          xCoord - 0.15,
          yCoord - 1.2,
          13, 1.35,
          { fill: '#770000',
            stroke: '#aa0000',
            opacity: 0.3,
            strokeWidth: 0.1
          });

        //* TOP ROW FLAGS
        room.visual.text(
            'CSL('    + rmFlgs.centralStorageLogic   +
          ')  SCS('    + rmFlgs.sortConSites          +
          ')  CCS('    + rmFlgs.closestConSites       +
          ')  CU('     + rmFlgs.craneUpgrades         +
          ')   HFA('   + rmFlgs.harvestersFixAdjacent +
          ')     RDM(' + rmFlgs.runnersDoMinerals     + ')',
          xCoord, (yCoord - 0.6),
          { align: 'left',
            font: fontSize,
            color: displayColor
          });
        //* BOTTOM ROW FLAGS
        room.visual.text(
            'RDP('  + rmFlgs.runnersDoPiles      +
          ')   RB('  + rmFlgs.repairBasics        +
          ')   RR('  + rmFlgs.repairRamparts      +
          ')    RW(' + rmFlgs.repairWalls         +
          ')   TRB(' + rmFlgs.towerRepairBasic    +
          ')   TRD(' + rmFlgs.towerRepairDefenses + ')',
          xCoord, yCoord - 0.1,
          { align: 'left',
            font: fontSize,
            color: displayColor
          });
      }

      //: ROOM CONTROLLER UPGRADE PROGRESS
      if (room.controller.level >= 1) visualRCProgress(room.controller);

      //: DISPLAY ENERGY ABOVE ROOM STORAGE
      if (room.storage)
        room.visual.text(
          ' Storage: ' + room.storage.store[RESOURCE_ENERGY],
          room.storage.pos.x,
          room.storage.pos.y - 1,
          { align: 'center',
            opacity: 0.8,
            font: 0.4,
            stroke:
            '#000000',
            color: '#ffff00'
          });

      //: TOWER DAMAGE BOX DISPLAYS
      if (room.memory.settings.visualSettings.displayTowerRanges) {
        _.forEach(room.memory.objects.towers, function (towerID) {
          const tower = Game.getObjectById(towerID);
          tower.room.visual.rect(-0.5, -0.5, 51, 51, { fill: '#550000', opacity: 0.25, stroke: '#880000' });
          tower.room.visual.rect(tower.pos.x - 19.5, tower.pos.y - 19.5, 39, 39, { fill: '#aa3e00', opacity: 0.15, stroke: '#ff8800' });
          tower.room.visual.rect(tower.pos.x - 15.5, tower.pos.y - 15.5, 31, 31, { fill: '#aaaa00', opacity: 0.2, stroke: '#ffff00' });
          tower.room.visual.rect(tower.pos.x - 10.5, tower.pos.y - 10.5, 21, 21, { fill: '#003300', opacity: 0.2, stroke: '#008800' });
          tower.room.visual.rect(tower.pos.x - 5.5, tower.pos.y - 5.5, 11, 11, { fill: '#4476ff', opacity: 0.25, stroke: '#00e1ff' });


        })
      }

      // #endregion *******************************************************************************************************************


    } // ! END OF (ROOMS CLAIMED BY BOT)
  }); // ! END OF (FOR EACH ROOM BOT HAS VISIBILITY)

  //$ >##########################################################################################################################< $\\
  //$> ############################################# ROLE EXECUTION SWITCH CASE ################################################# <$\\
  //$ >##########################################################################################################################< $\\


  //$ >########################################## END OF ROLE EXECUTION SWITCH CASE ##############################################< $\\
  tickCount++;
}); // ! END OF MAIN LOOP

/*
const colonySpawnerDaemon = function(room: Room): any {

	const colIndex:   number           = Memory.colonies.colonyList.indexOf(room.name);
	const colonyNum:  number           = colIndex + 1;
	const colonyName: string           = 'Col' + colonyNum;
	const roomLvl: 		number 				 	 = room.controller.level;
	const roomName: 	string 				   = room.name;
	const roomSpawns: StructureSpawn[] = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_SPAWN}});
	let 	freeSpawn: 	StructureSpawn;

	const nameList: {[key: string]: string} = {
		harvester: "_H",
		filler: "_F",
		collector: "_C",
		upgrader: "_U",
		builder: "_B",
		repairer: "_Rp",
		runner: "_Rn",
		rebooter: "_Rb",
		reserver: "_Rv",
		ranger: "_Rng",
		warrior: "_War",
		healer: "_Hlr",
		crane: "_Cn",
		miner: "_M",
		scientist: "_Sn",
		scout: "_Sc",
		remoteharvester: "_RH",
		remotebuilder: "_RB",
		remoteguard: "_RG",
		remotelogistician: "_RL"
	}

	for (let i = 0; i < roomSpawns.length; i++) {
		const curSpawn: StructureSpawn = roomSpawns[i];

		if (curSpawn.spawning)
			continue;
		else {
			freeSpawn = curSpawn;
			break;
		}
	}

	if (freeSpawn) {

		const spawnGoals = room.memory.targets;
		const spawnPriority: CreepRoles[] = spawnPriorityList[roomLvl];

		const currentCreeps: {[key: string]: number} = {
			harvester:         _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'harvester'         &&      creep.memory.homeRoom == roomName).length,
			filler:         	 _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'filler'    	       &&      creep.memory.homeRoom == roomName).length,
			collector:         _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'collector'  	     &&      creep.memory.homeRoom == roomName).length,
			upgrader:          _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'upgrader'          &&      creep.memory.homeRoom == roomName).length,
			builder:           _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'builder'           &&      creep.memory.homeRoom == roomName).length,
			repairer:          _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'repairer'          &&      creep.memory.homeRoom == roomName).length,
			runner:            _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'runner'            &&      creep.memory.homeRoom == roomName).length,
			rebooter:          _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'rebooter'          &&      creep.memory.homeRoom == roomName).length,
			reserver:          _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'reserver'          &&      creep.memory.homeRoom == roomName).length,
			ranger:            _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'ranger'            &&      creep.memory.homeRoom == roomName).length,
			warrior:           _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'warrior'           &&      creep.memory.homeRoom == roomName).length,
			healer:            _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'healer'            &&      creep.memory.homeRoom == roomName).length,
			crane:             _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'crane'             &&      creep.memory.homeRoom == roomName).length,
			miner:             _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'miner'             &&      creep.memory.homeRoom == roomName).length,
			scientist:         _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'scientist'         &&      creep.memory.homeRoom == roomName).length,
			scout:             _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'scout'             &&      creep.memory.homeRoom == roomName).length,
			remoteHarvester:   _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'remoteharvester'   &&      creep.memory.homeRoom == roomName).length,
			remoteBuilder:     _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'remotebuilder'     &&      creep.memory.homeRoom == roomName).length,
			remoteGuard:       _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'remoteguard'       &&      creep.memory.homeRoom == roomName).length,
			remoteLogistician: _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'remotelogistician' &&      creep.memory.homeRoom == roomName).length
		}

		for (let i = 0; i < spawnPriority.length; i++) {
			const currentSpawn: CreepRoles = spawnPriority[i];
			let spawnIteration = 1;
			const creepsAlive = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == spawnPriority[i] && creep.memory.homeRoom == roomName).length;

			if (creepsAlive < spawnGoals[currentSpawn]) {
				let name = colonyName + nameList[currentSpawn] + spawnIteration;
				const result = freeSpawn.spawnCreep(availableVariants[currentSpawn].body, name, { memory: { role: currentSpawn, roleForQuota: currentSpawn, homeRoom: room.name, rallyPoint: 'none'} });
				let logMsg: string;

				switch (result) {
					case OK:
						logMsg += '\n... SUCCESS! RESULT CODE: ' + returnCode(result);
						log(logMsg, room);
						break;
					case ERR_NAME_EXISTS:
						logMsg += '\n... FAILED! RESULT CODE: ' + returnCode(result);
						log(logMsg, room);
						spawnIteration++;
						while (freeSpawn.spawnCreep(availableVariants[currentSpawn].body, name, { memory: { role: currentSpawn, roleForQuota: currentSpawn, homeRoom: room.name, rallyPoint: 'none'} }) == ERR_NAME_EXISTS) {
							spawnIteration++;
							name = colonyName + nameList[currentSpawn] + spawnIteration;
						}
						break;
					case ERR_NOT_ENOUGH_RESOURCES:
						logMsg += '\n... FAILED! RESULT CODE: ' + returnCode(result);
						log(logMsg, room);

						break;
					default:
						break;
				}
			}
		}
	}

	else
		return;
}
*/


