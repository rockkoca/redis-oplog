import {Mongo} from 'meteor/mongo';
import {_} from 'meteor/underscore';
import extendObserveChanges from './extendObserveChanges';
import _validatedInsert from './allow-deny/validatedInsert'
import _validatedUpdate from './allow-deny/validatedUpdate'
import _validatedRemove from './allow-deny/validatedRemove'
import Mutator from './Mutator';

export default () => {
    const Originals = {
        insert: Mongo.Collection.prototype.insert,
        update: Mongo.Collection.prototype.update,
        remove: Mongo.Collection.prototype.remove,
        find: Mongo.Collection.prototype.find,
    };

    Mutator.init();

    _.extend(Mongo.Collection.prototype, {
        find(...args) {
            var cursor = Originals.find.call(this, ...args);

            extendObserveChanges(cursor, ...args);

            return cursor;
        },

        /**
         * @param data
         * @param config
         * @returns {*}
         */
        insert(data, config) {
            return Mutator.insert.call(this, Originals, data, config);
        },

        /**
         * @param selector
         * @param modifier
         * @param config
         * @param callback
         * @returns {*}
         */
        update(selector, modifier, config, callback) {
            return Mutator.update.call(this, Originals, selector, modifier, config, callback);
        },

        /**
         * @param selector
         * @param config
         * @returns {*}
         */
        remove(selector, config) {
            return Mutator.remove.call(this, Originals, selector, config);
        },

        _validatedInsert,
        _validatedUpdate,
        _validatedRemove,

        /**
         * Configure defaults for your collection
         *
         * @param {function} mutation
         * @param {function} cursor
         */
        configureRedisOplog({mutation, cursor}) {
            this._redisOplog = {};
            if (mutation) {
                if (!_.isFunction(mutation)) {
                    throw new Meteor.Error('To configure defaults for the collection, "mutation" needs to be a function')
                }

                this._redisOplog.mutation = mutation;
            }
            if (cursor) {
                if (!_.isFunction(cursor)) {
                    throw new Meteor.Error('To configure defaults for the collection, "cursor" needs to be a function')
                }

                this._redisOplog.cursor = cursor;
            }
        }
    });
}
