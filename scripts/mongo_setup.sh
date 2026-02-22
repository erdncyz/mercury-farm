#!/bin/bash

mongosh --host mercury-mongo:27017 <<EOF
    rs.initiate({
        _id:'mercury-rs',
        members: [
            {
                _id:0,
                host:'mercury-mongo:27017',
                priority: 2
            }
        ]
    })
EOF
