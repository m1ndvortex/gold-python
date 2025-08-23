import React, { useState, useEffect } from 'react';
import { DataSource, Relationship } from '../../types/reportBuilder';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Database, Table, Link } from 'lucide-react';

interface DataSourceSelectorProps {
  availableDataSources: DataSource[];
  selectedDataSources: DataSource[];
  onDataSourceSelect: (dataSource: DataSource) => void;
  onDataSourceRemove: (dataSourceId: string) => void;
  onRelationshipAdd: (relationship: Relationship) => void;
}

export const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({
  availableDataSources,
  selectedDataSources,
  onDataSourceSelect,
  onDataSourceRemove,
  onRelationshipAdd
}) => {
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [showRelationshipBuilder, setShowRelationshipBuilder] = useState(false);

  const handleDataSourceAdd = () => {
    const dataSource = availableDataSources.find(ds => ds.id === selectedSourceId);
    if (dataSource && !selectedDataSources.find(ds => ds.id === dataSource.id)) {
      onDataSourceSelect(dataSource);
      setSelectedSourceId('');
    }
  };

  const getDataSourceIcon = (type: string) => {
    switch (type) {
      case 'table':
        return <Table className="w-4 h-4" />;
      case 'view':
        return <Database className="w-4 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Sources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Data Source */}
        <div className="flex gap-2">
          <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a data source..." />
            </SelectTrigger>
            <SelectContent>
              {availableDataSources
                .filter(ds => !selectedDataSources.find(selected => selected.id === ds.id))
                .map(dataSource => (
                  <SelectItem key={dataSource.id} value={dataSource.id}>
                    <div className="flex items-center gap-2">
                      {getDataSourceIcon(dataSource.type)}
                      <span>{dataSource.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {dataSource.type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleDataSourceAdd}
            disabled={!selectedSourceId}
            size="sm"
          >
            Add
          </Button>
        </div>

        {/* Selected Data Sources */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Data Sources</h4>
          {selectedDataSources.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data sources selected</p>
          ) : (
            <div className="space-y-2">
              {selectedDataSources.map(dataSource => (
                <div
                  key={dataSource.id}
                  className="flex items-center justify-between p-2 border rounded-md bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    {getDataSourceIcon(dataSource.type)}
                    <span className="font-medium">{dataSource.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {dataSource.fields.length} fields
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDataSourceRemove(dataSource.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Relationships */}
        {selectedDataSources.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Relationships</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRelationshipBuilder(!showRelationshipBuilder)}
              >
                <Link className="w-4 h-4 mr-1" />
                Add Relationship
              </Button>
            </div>
            
            {showRelationshipBuilder && (
              <RelationshipBuilder
                dataSources={selectedDataSources}
                onRelationshipAdd={onRelationshipAdd}
                onClose={() => setShowRelationshipBuilder(false)}
              />
            )}

            {/* Display existing relationships */}
            <div className="space-y-1">
              {selectedDataSources.flatMap(ds => ds.relationships).map(relationship => (
                <div
                  key={relationship.id}
                  className="flex items-center gap-2 p-2 text-sm bg-blue-50 border border-blue-200 rounded"
                >
                  <Link className="w-3 h-3 text-blue-600" />
                  <span>
                    {relationship.sourceTable}.{relationship.sourceField} → {relationship.targetTable}.{relationship.targetField}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {relationship.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface RelationshipBuilderProps {
  dataSources: DataSource[];
  onRelationshipAdd: (relationship: Relationship) => void;
  onClose: () => void;
}

const RelationshipBuilder: React.FC<RelationshipBuilderProps> = ({
  dataSources,
  onRelationshipAdd,
  onClose
}) => {
  const [sourceTable, setSourceTable] = useState('');
  const [targetTable, setTargetTable] = useState('');
  const [sourceField, setSourceField] = useState('');
  const [targetField, setTargetField] = useState('');
  const [relationshipType, setRelationshipType] = useState<'one-to-one' | 'one-to-many' | 'many-to-many'>('one-to-many');

  const sourceDataSource = dataSources.find(ds => ds.id === sourceTable);
  const targetDataSource = dataSources.find(ds => ds.id === targetTable);

  const handleAddRelationship = () => {
    if (sourceTable && targetTable && sourceField && targetField) {
      const relationship: Relationship = {
        id: `${sourceTable}_${targetTable}_${Date.now()}`,
        sourceTable,
        targetTable,
        sourceField,
        targetField,
        type: relationshipType
      };
      onRelationshipAdd(relationship);
      onClose();
    }
  };

  return (
    <div className="p-3 border rounded-md bg-background space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium">Source Table</label>
          <Select value={sourceTable} onValueChange={setSourceTable}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select source..." />
            </SelectTrigger>
            <SelectContent>
              {dataSources.map(ds => (
                <SelectItem key={ds.id} value={ds.id}>{ds.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium">Target Table</label>
          <Select value={targetTable} onValueChange={setTargetTable}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select target..." />
            </SelectTrigger>
            <SelectContent>
              {dataSources.filter(ds => ds.id !== sourceTable).map(ds => (
                <SelectItem key={ds.id} value={ds.id}>{ds.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium">Source Field</label>
          <Select value={sourceField} onValueChange={setSourceField}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select field..." />
            </SelectTrigger>
            <SelectContent>
              {sourceDataSource?.fields.map(field => (
                <SelectItem key={field.id} value={field.id}>{field.displayName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium">Target Field</label>
          <Select value={targetField} onValueChange={setTargetField}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select field..." />
            </SelectTrigger>
            <SelectContent>
              {targetDataSource?.fields.map(field => (
                <SelectItem key={field.id} value={field.id}>{field.displayName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium">Relationship Type</label>
        <Select value={relationshipType} onValueChange={(value: any) => setRelationshipType(value)}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one-to-one">One to One</SelectItem>
            <SelectItem value="one-to-many">One to Many</SelectItem>
            <SelectItem value="many-to-many">Many to Many</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          size="sm" 
          onClick={handleAddRelationship}
          disabled={!sourceTable || !targetTable || !sourceField || !targetField}
        >
          Add Relationship
        </Button>
      </div>
    </div>
  );
};